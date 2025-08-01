import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import fs from "fs";
import { config } from "dotenv";
import { AppDataSource } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import displayRoutes from "./routes/display";
import sessionsRoutes from "./routes/sessions";
import mainRoutes from "./routes/main";
import { initializePassport } from "./config/passport";
import { isAuthenticated } from "./middleware/auth";

// Load environment variables
config();

const app = express();
const uploadDir = path.join(__dirname, "..", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadDir));

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
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
const handleMulterError = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size should be less than 100MB" });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};

// Upload endpoint with authentication
app.post("/api/upload", isAuthenticated, upload.single("file"), handleMulterError, (req: express.Request, res: express.Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        logger.info(`File uploaded successfully: ${req.file.filename}`);
        res.json({ url: `/uploads/${req.file.filename}` });
    } catch (error) {
        logger.error("Error in upload endpoint:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// Initialize passport
initializePassport();

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/display", displayRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/", mainRoutes);

// Global error handler
app.use(errorHandler);

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        logger.info("Database connection established");

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Upload directory: ${uploadDir}`);
        });
    })
    .catch((error) => {
        logger.error("Error during database initialization:", error);
    }); 