"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    logger_1.logger.error(`Error: ${message}`, {
        error: err,
        path: req.path,
        method: req.method
    });
    res.status(statusCode).json({
        message,
        status: "error"
    });
};
exports.errorHandler = errorHandler;
