const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { convert } = require('pdf-poppler');

const app = express();
const port = 5000;

// Configure CORS to allow specific origins and credentials
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.use('/uploads', express.static(uploadsDir));

// Handle file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const filePath = path.join(uploadsDir, file.filename);
  const fileExt = path.extname(file.filename).toLowerCase();

  if (fileExt === '.pdf') {
    const outputDir = path.join(uploadsDir, path.basename(file.filename, '.pdf'));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const options = {
      format: 'jpeg',
      out_dir: outputDir,
      out_prefix: path.basename(file.filename, '.pdf'),
      page: null
    };

    try {
      await convert(filePath, options);
      const files = fs.readdirSync(outputDir).map(file => `http://127.0.0.1:5000/uploads/${path.basename(file.filename, '.pdf')}/${file}`);
      res.json({ files });
    } catch (error) {
      console.error('Error converting PDF:', error);
      res.status(500).send('Error converting PDF');
    }
  } else {
    res.json({ files: [`http://127.0.0.1:5000/uploads/${file.filename}`] });
  }
});

// Endpoint to process invoice using Python script
app.post('/processInvoice', async (req, res) => {
  try {
    const { fileName } = req.body;
    console.log('Processing file:', fileName);

    if (!fileName) {
      return res.status(400).json({ error: 'File name is undefined' });
    }

    const filePath = path.join(uploadsDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    const pythonProcess = spawn('python', ['d2.py', filePath]);

    let pythonOutput = '';
    let pythonError = '';

    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);

      if (code !== 0) {
        console.error('Python script error:', pythonError);
        return res.status(500).json({ error: 'Python script error', details: pythonError });
      }

      try {
        // Extract the JSON data from the Python output
        const match = pythonOutput.match(/output data: (.*)/);
        if (match && match[1]) {
          const outputData = JSON.parse(match[1]);
          if (outputData.response_content) {
            const invoiceData = JSON.parse(outputData.response_content);
            res.json(invoiceData);
          } else {
            throw new Error('No response content found in output data');
          }
        } else {
          throw new Error('No output data found in Python script output');
        }
      } catch (error) {
        console.error('Error parsing Python script output:', error);
        console.error('Python output:', pythonOutput);
        res.status(500).json({ error: 'Failed to parse invoice data', details: error.message });
      }
    });
  } catch (error) {
    console.error('Error processing invoice:', error);
    res.status(500).json({ error: 'Failed to process invoice', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});