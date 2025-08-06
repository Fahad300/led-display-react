"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.getConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
// Load environment variables
dotenv_1.default.config();
/**
 * Validate required environment variables
 */
const validateEnv = () => {
    const required = [
        "DB_HOST",
        "DB_USERNAME",
        "DB_PASSWORD",
        "DB_DATABASE",
        "JWT_SECRET"
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        logger_1.logger.error(`Missing required environment variables: ${missing.join(", ")}`);
        process.exit(1);
    }
};
/**
 * Get environment configuration
 */
const getConfig = () => {
    validateEnv();
    return {
        database: {
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT || "3306", 10),
            username: process.env.DB_USERNAME || "led_display_user",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_DATABASE || "led_display_db",
            synchronize: process.env.DB_SYNCHRONIZE === "true"
        },
        jwt: {
            secret: process.env.JWT_SECRET || "default_secret_key",
            expiresIn: process.env.JWT_EXPIRES_IN || "24h"
        },
        server: {
            port: parseInt(process.env.PORT || "3001", 10),
            nodeEnv: process.env.NODE_ENV || "development"
        },
        upload: {
            path: process.env.UPLOAD_PATH || "./uploads",
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10)
        },
        logging: {
            level: process.env.LOG_LEVEL || "info"
        }
    };
};
exports.getConfig = getConfig;
exports.config = (0, exports.getConfig)();
