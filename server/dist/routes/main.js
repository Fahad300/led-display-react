"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
/**
 * @route GET /
 * @desc Serve the server status page
 * @access Public
 */
router.get("/", (req, res) => {
    try {
        const indexPath = path_1.default.join(__dirname, "..", "..", "public", "index.html");
        logger_1.logger.info(`Attempting to serve file from: ${indexPath}`);
        res.sendFile(indexPath, (err) => {
            if (err) {
                logger_1.logger.error(`Error serving index.html: ${err.message}`);
                res.status(500).send("Error serving page");
            }
        });
    }
    catch (error) {
        logger_1.logger.error("Error serving root page:", error);
        res.status(500).send("Error serving page");
    }
});
exports.default = router;
