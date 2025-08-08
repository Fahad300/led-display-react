import express from "express";
import axios from "axios";
import { logger } from "../utils/logger";

const router = express.Router();

/**
 * Proxy endpoint for external API calls
 * This bypasses CORS issues by making the request server-side
 */
router.get("/celebrations", async (req, res) => {
    try {
        const externalApiUrl = process.env.EXTERNAL_API_URL;
        const externalApiToken = process.env.EXTERNAL_API_TOKEN;

        if (!externalApiToken) {
            logger.error("EXTERNAL_API_TOKEN not configured");
            return res.status(500).json({
                error: "External API token not configured",
                message: "Please set EXTERNAL_API_TOKEN in environment variables"
            });
        }

        const response = await axios.get(`${externalApiUrl}/celebrations`, {
            headers: {
                "Authorization": `Bearer ${externalApiToken}`,
                "Content-Type": "application/json"
            },
            timeout: 30000 // Increased from 10000ms to 30000ms (30 seconds)
        });

        res.json(response.data);

    } catch (error) {
        logger.error("Error proxying external API call:", error);

        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || error.message;

            res.status(status).json({
                error: "External API request failed",
                message: message,
                status: status
            });
        } else {
            res.status(500).json({
                error: "Internal server error",
                message: "Failed to proxy external API request"
            });
        }
    }
});

/**
 * Generic proxy endpoint for other external API calls
 */
router.all("/*", async (req, res) => {
    try {
        const externalApiUrl = process.env.EXTERNAL_API_URL || "https://sep.solitontechnologies.com/api";
        const externalApiToken = process.env.EXTERNAL_API_TOKEN;
        const path = (req.params as any)["0"]; // Get the path after /proxy/

        if (!externalApiToken) {
            logger.error("EXTERNAL_API_TOKEN not configured");
            return res.status(500).json({
                error: "External API token not configured",
                message: "Please set EXTERNAL_API_TOKEN in environment variables"
            });
        }

        const targetUrl = `${externalApiUrl}/${path}`;

        const config: any = {
            method: req.method,
            url: targetUrl,
            headers: {
                "Authorization": `Bearer ${externalApiToken}`,
                "Content-Type": "application/json"
            },
            timeout: 30000 // Increased from 10000ms to 30000ms (30 seconds)
        };

        if (req.method !== "GET") {
            config.data = req.body;
        }

        const response = await axios(config);

        res.json(response.data);

    } catch (error) {
        logger.error("Error proxying external API call:", error);

        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || error.message;

            res.status(status).json({
                error: "External API request failed",
                message: message,
                status: status
            });
        } else {
            res.status(500).json({
                error: "Internal server error",
                message: "Failed to proxy external API request"
            });
        }
    }
});

export default router; 