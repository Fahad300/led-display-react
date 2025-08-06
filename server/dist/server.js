"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const display_1 = __importDefault(require("./routes/display"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const files_1 = __importDefault(require("./routes/files"));
const main_1 = __importDefault(require("./routes/main"));
const passport_1 = require("./config/passport");
// Load environment variables
(0, dotenv_1.config)();
const app = (0, express_1.default)();
// Enable CORS for all routes
app.use((0, cors_1.default)());
// Parse JSON bodies
app.use(express_1.default.json());
// Initialize passport
(0, passport_1.initializePassport)();
// Use routes
app.use("/api/auth", auth_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/display", display_1.default);
app.use("/api/sessions", sessions_1.default);
app.use("/api/files", files_1.default);
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
        logger_1.logger.info("✅ Database-based file storage enabled");
    });
})
    .catch((error) => {
    logger_1.logger.error("Error during database initialization:", error);
});
