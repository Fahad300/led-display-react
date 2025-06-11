"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const Display_1 = require("../models/Display");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const dbPath = path_1.default.join(__dirname, "../../database.sqlite");
// Ensure database directory exists
const dbDir = path_1.default.dirname(dbPath);
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
exports.AppDataSource = new typeorm_1.DataSource({
    type: "sqlite",
    database: dbPath,
    synchronize: true,
    logging: true, // Enable logging in all environments for debugging
    entities: [User_1.User, Display_1.Display],
    migrations: [],
    subscribers: []
});
const connectDB = async () => {
    try {
        await exports.AppDataSource.initialize();
        logger_1.logger.info("SQLite Database Connected...");
        // Verify database state
        const userRepository = exports.AppDataSource.getRepository(User_1.User);
        const userCount = await userRepository.count();
        logger_1.logger.info(`Current user count in database: ${userCount}`);
        // Log database path
        logger_1.logger.info(`Database file location: ${dbPath}`);
        // Check if database file exists
        if (fs_1.default.existsSync(dbPath)) {
            const stats = fs_1.default.statSync(dbPath);
            logger_1.logger.info(`Database file size: ${stats.size} bytes`);
        }
        else {
            logger_1.logger.warn("Database file does not exist yet. It will be created on first write.");
        }
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Database connection error: ${error.message}`);
            logger_1.logger.error(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
    }
};
exports.connectDB = connectDB;
