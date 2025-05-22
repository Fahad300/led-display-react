import express from "express";
import path from "path";
import { logger } from "../utils/logger";

const router = express.Router();

/**
 * @route GET /
 * @desc Serve the server status page
 * @access Public
 */
router.get("/", (req: express.Request, res: express.Response) => {
    try {
        const indexPath = path.join(__dirname, "..", "..", "public", "index.html");
        logger.info(`Attempting to serve file from: ${indexPath}`);
        res.sendFile(indexPath, (err) => {
            if (err) {
                logger.error(`Error serving index.html: ${err.message}`);
                res.status(500).send("Error serving page");
            }
        });
    } catch (error) {
        logger.error("Error serving root page:", error);
        res.status(500).send("Error serving page");
    }
});

export default router; 