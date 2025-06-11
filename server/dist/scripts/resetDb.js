"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resetDatabase = async () => {
    try {
        // Initialize the database connection
        await database_1.AppDataSource.initialize();
        logger_1.logger.info("Database connection initialized");
        // Drop all tables
        await database_1.AppDataSource.dropDatabase();
        logger_1.logger.info("Database dropped");
        // Close the connection
        await database_1.AppDataSource.destroy();
        logger_1.logger.info("Database connection closed");
        // Delete the SQLite file
        const dbPath = path_1.default.join(__dirname, "../../database.sqlite");
        if (fs_1.default.existsSync(dbPath)) {
            fs_1.default.unlinkSync(dbPath);
            logger_1.logger.info("SQLite file deleted");
        }
        logger_1.logger.info("Database reset completed successfully");
        process.exit(0);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Database reset error: ${error.message}`);
        }
        process.exit(1);
    }
};
// Run the reset
resetDatabase();
