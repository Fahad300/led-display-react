import winston from "winston";

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" })
    ]
});

if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        level: "info",
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: "HH:mm:ss" }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                // Only show essential information
                if (meta.error && typeof meta.error === 'object' && 'stack' in meta.error) {
                    const error = meta.error as Error;
                    return `${timestamp} ${level}: ${message} ${error.stack ? error.stack.split('\n')[0] : ''}`;
                }
                return `${timestamp} ${level}: ${message}`;
            })
        )
    }));
} 