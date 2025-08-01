"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: "error.log", level: "error" }),
        new winston_1.default.transports.File({ filename: "combined.log" })
    ]
});
if (process.env.NODE_ENV !== "production") {
    exports.logger.add(new winston_1.default.transports.Console({
        level: "info",
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: "HH:mm:ss" }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
            // Only show essential information
            if (meta.error && typeof meta.error === 'object' && 'stack' in meta.error) {
                const error = meta.error;
                return `${timestamp} ${level}: ${message} ${error.stack ? error.stack.split('\n')[0] : ''}`;
            }
            return `${timestamp} ${level}: ${message}`;
        }))
    }));
}
