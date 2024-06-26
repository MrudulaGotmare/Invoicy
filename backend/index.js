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
  credentials: true, // Enable credentials
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
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage });

// Serve static files from the uploads directory
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
      const files = fs.readdirSync(outputDir).map(file => `http://127.0.0.1:5000/uploads/${path.basename(filePath, '.pdf')}/${file}`);
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
    const { filePath } = req.body; // Assuming filePath is sent in the request body

    const pythonProcess = spawn('python', ['d2.py', filePath]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      res.json({ message: 'Invoice processing completed' });
    });
  } catch (error) {
    console.error('Error processing invoice:', error);
    res.status(500).json({ error: 'Failed to process invoice' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
