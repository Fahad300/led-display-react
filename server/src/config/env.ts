import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config(); // Automatically reads .env in UTF-8

/**
 * Environment configuration interface
 */
interface EnvironmentConfig {
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        synchronize: boolean;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    server: {
        port: number;
        nodeEnv: string;
    };
    upload: {
        path: string;
        maxFileSize: number;
    };
    logging: {
        level: string;
    };
}

/**
 * Validate required environment variables
 */
const validateEnv = (): void => {
    const required = [
        "DB_HOST",
        "DB_USERNAME",
        "DB_PASSWORD",
        "DB_DATABASE",
        "JWT_SECRET"
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(", ")}`);
        process.exit(1);
    }
};

/**
 * Get environment configuration
 */
export const getConfig = (): EnvironmentConfig => {
    validateEnv();

    return {
        database: {
            host: process.env.DB_HOST!,
            port: parseInt(process.env.DB_PORT || "3306", 10),
            username: process.env.DB_USERNAME!,
            password: process.env.DB_PASSWORD!,
            database: process.env.DB_DATABASE!,
            synchronize: process.env.DB_SYNCHRONIZE === "true"
        },
        jwt: {
            secret: process.env.JWT_SECRET!,
            expiresIn: process.env.JWT_EXPIRES_IN || "24h"
        },
        server: {
            port: parseInt(process.env.PORT || "5000", 10),
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

export const config = getConfig();
