import { DataSource } from "../types";

/**
 * Manual configuration for slide data sources
 * Change these values to set the data source for all slides of each type
 */
export const SLIDE_DATA_SOURCES = {
    "current-escalations-slide": "API" as DataSource,
    "team-comparison-slide": "API" as DataSource,
    "graph-slide": "API" as DataSource,
    "event-slide": "AUTOMATED" as DataSource,
    "image-slide": "FILE" as DataSource,
    "video-slide": "FILE" as DataSource,
    "news-slide": "FILE" as DataSource,
    "text-slide": "MANUAL" as DataSource,
    "document-slide": "FILE" as DataSource,
    "birthday-slide": "AUTOMATED" as DataSource,
    "anniversary-slide": "AUTOMATED" as DataSource
}; 