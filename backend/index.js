const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { convert } = require('pdf-poppler');
const app = express();
const port = 5000;

// Enable CORS
app.use(cors({
  origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
  credentials: true
}));

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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
