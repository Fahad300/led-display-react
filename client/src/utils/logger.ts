/**
 * Conditional logger that only logs in development mode
 * Respects the developmentMode setting from SettingsContext
 */

type LogLevel = "log" | "info" | "warn" | "error";

class Logger {
    private isDevelopmentMode(): boolean {
        // Check if we're in development environment
        const isDev = process.env.NODE_ENV === "development";

        // Check if development mode is enabled in settings (from localStorage)
        const settingsStr = localStorage.getItem("displaySettings");
        if (settingsStr) {
            try {
                const settings = JSON.parse(settingsStr);
                return isDev || settings.developmentMode === true;
            } catch {
                return isDev;
            }
        }

        return isDev;
    }

    private shouldLog(): boolean {
        return this.isDevelopmentMode();
    }

    log(...args: any[]): void {
        if (this.shouldLog()) {
            console.log(...args);
        }
    }

    info(...args: any[]): void {
        if (this.shouldLog()) {
            console.info(...args);
        }
    }

    warn(...args: any[]): void {
        if (this.shouldLog()) {
            console.warn(...args);
        }
    }

    error(...args: any[]): void {
        // Always log errors, even in production
        console.error(...args);
    }

    debug(...args: any[]): void {
        if (this.shouldLog()) {
            console.log(...args);
        }
    }

    // Special logging for API operations
    api(...args: any[]): void {
        if (this.shouldLog()) {
            console.log("📡", ...args);
        }
    }

    // Special logging for sync operations
    sync(...args: any[]): void {
        if (this.shouldLog()) {
            console.log("🔄", ...args);
        }
    }

    // Special logging for data changes
    data(...args: any[]): void {
        if (this.shouldLog()) {
            console.log("📊", ...args);
        }
    }

    // Special logging for success
    success(...args: any[]): void {
        if (this.shouldLog()) {
            console.log("✅", ...args);
        }
    }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience function to check if logging is enabled
export const isLoggingEnabled = (): boolean => {
    const isDev = process.env.NODE_ENV === "development";
    const settingsStr = localStorage.getItem("displaySettings");
    if (settingsStr) {
        try {
            const settings = JSON.parse(settingsStr);
            return isDev || settings.developmentMode === true;
        } catch {
            return isDev;
        }
    }
    return isDev;
};

