import { DataSource } from "../types";

/**
 * Manual configuration for slide data sources
 * Change these values to set the data source for all slides of each type
 */
export const SLIDE_DATA_SOURCES = {
    "current-esc-slide": "API" as DataSource,
    "team-comparison-slide": "API" as DataSource,
    "graph-slide": "API" as DataSource,
    "event-slide": "API" as DataSource,
    "image-slide": "FILE" as DataSource,
    "video-slide": "FILE" as DataSource,
    "news-slide": "FILE" as DataSource,
    "text-slide": "MANUAL" as DataSource,
    "document-slide": "FILE" as DataSource,
    "birthday-slide": "API" as DataSource,
    "anniversary-slide": "API" as DataSource
}; 