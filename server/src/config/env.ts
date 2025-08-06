import dotenv from "dotenv";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";

// Check if .env file exists
const envPath = path.resolve('./.env');
console.log('Looking for .env file at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

// Load environment variables with UTF-16 support
try {
    // Try to read as UTF-16 first
    const envContent = fs.readFileSync(envPath, 'utf16le');
    console.log('Reading .env file as UTF-16');

    // Parse the content manually and set environment variables
    const lines = envContent.split('\n');
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const equalIndex = trimmedLine.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmedLine.substring(0, equalIndex);
                const value = trimmedLine.substring(equalIndex + 1);
                process.env[key] = value;
                console.log(`Set env var: ${key}=${value}`);
            }
        }
    });
} catch (error) {
    console.log('Error reading .env file as UTF-16, trying UTF-8:', error);
    // Fallback to dotenv
    dotenv.config({ path: envPath });
}

console.log('env.ts: Environment variables loaded:', {
    DB_HOST: process.env.DB_HOST,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_DATABASE: process.env.DB_DATABASE,
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
});

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