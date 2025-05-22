import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface CustomError extends Error {
    statusCode?: number;
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`Error: ${message}`, {
        error: err,
        path: req.path,
        method: req.method
    });

    res.status(statusCode).json({
        message,
        status: "error"
    });
}; 