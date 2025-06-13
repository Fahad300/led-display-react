const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const adminRoutes = require('./src/routes/admin');
const { isAuthenticated } = require('./src/middleware/auth');
const { errorHandler } = require('./src/middleware/errorHandler');
const { logger } = require('./src/utils/logger');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadDir));

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            "image/",
            "video/",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel", // .xls
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
            "application/vnd.ms-powerpoint", // .ppt
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        ];

        const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime) || file.mimetype === mime);

        if (isAllowed) {
            cb(null, true);
        } else {
            cb(new Error("Only image, video, PDF, and Office files (Excel, PowerPoint, Word) are allowed"));
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size should be less than 100MB" });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};

// Upload endpoint with authentication
app.post('/api/upload', isAuthenticated, upload.single('file'), handleMulterError, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        logger.info(`File uploaded successfully: ${req.file.filename}`);
        res.json({ url: `/uploads/${req.file.filename}` });
    } catch (error) {
        logger.error('Error in upload endpoint:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Admin routes
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Upload server is running. Use POST /api/upload to upload files.');
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Upload directory: ${uploadDir}`);
});