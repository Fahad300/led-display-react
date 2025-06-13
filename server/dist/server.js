"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = require("dotenv");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const display_1 = __importDefault(require("./routes/display"));
const main_1 = __importDefault(require("./routes/main"));
const passport_1 = require("./config/passport");
const auth_2 = require("./middleware/auth");
// Load environment variables
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const uploadDir = path_1.default.join(__dirname, "..", "uploads");
// Ensure upload directory exists
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Enable CORS for all routes
app.use((0, cors_1.default)());
// Parse JSON bodies
app.use(express_1.default.json());
// Serve static files from uploads directory
app.use("/uploads", express_1.default.static(uploadDir));
// Multer setup
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
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
        }
        else {
            cb(new Error("Only image, video, PDF, and Office files (Excel, PowerPoint, Word) are allowed"));
        }
    }
});
// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size should be less than 100MB" });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};
// Upload endpoint with authentication
app.post("/api/upload", auth_2.isAuthenticated, upload.single("file"), handleMulterError, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        logger_1.logger.info(`File uploaded successfully: ${req.file.filename}`);
        res.json({ url: `/uploads/${req.file.filename}` });
    }
    catch (error) {
        logger_1.logger.error("Error in upload endpoint:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});
// Initialize passport
(0, passport_1.initializePassport)();
// Use routes
app.use("/api/auth", auth_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/display", display_1.default);
app.use("/", main_1.default);
// Global error handler
app.use(errorHandler_1.errorHandler);
// Initialize database connection
database_1.AppDataSource.initialize()
    .then(() => {
    logger_1.logger.info("Database connection established");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        logger_1.logger.info(`Server running on port ${PORT}`);
        logger_1.logger.info(`Upload directory: ${uploadDir}`);
    });
})
    .catch((error) => {
    logger_1.logger.error("Error during database initialization:", error);
});
