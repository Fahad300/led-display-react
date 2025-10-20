/**
 * Socket.IO Manager for Real-Time Display Updates
 * 
 * Handles WebSocket connections for instant push notifications
 * from HomePage (admin) to DisplayPage (remote screens).
 * 
 * Architecture:
 * - DisplayPages join rooms based on their domain/hostname
 * - HomePage broadcasts updates to specific domain rooms
 * - Updates trigger React Query invalidation on DisplayPages
 * 
 * TODO: Add Redis adapter for horizontal scaling when needed
 * TODO: Add authentication for display registration if multi-tenant
 */

import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "./logger";

/**
 * Update event types that can be broadcast
 */
export type UpdateType =
    | "slides"          // Slide changes (add/edit/delete/reorder)
    | "settings"        // Display settings changed
    | "api-data"        // External API data refreshed
    | "force-reload"    // Force full page reload
    | "all";            // Everything changed

/**
 * Update event payload
 */
export interface UpdateEvent {
    type: UpdateType;
    domain: string;     // Target domain/hostname
    timestamp: number;
    source?: string;    // Which component triggered update
    data?: any;         // Optional metadata
}

/**
 * Socket.IO Manager Class
 */
class SocketManager {
    private io: SocketIOServer | null = null;
    private connectedDisplays: Map<string, Set<string>> = new Map(); // domain -> socketIds

    /**
     * Initialize Socket.IO server
     */
    public initialize(httpServer: HttpServer): void {
        if (this.io) {
            logger.warn("Socket.IO already initialized");
            return;
        }

        // Create Socket.IO server with CORS configuration
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || "*", // Allow client origin
                methods: ["GET", "POST"],
                credentials: true
            },
            // Connection options for 24/7 reliability
            pingTimeout: 120000,     // 120s before considering connection dead (increased for reliability)
            pingInterval: 25000,     // Ping every 25s to keep connection alive
            transports: ["websocket", "polling"], // Prefer WebSocket, fallback to polling
            allowEIO3: true,         // Allow Engine.IO v3 clients (compatibility)
            // CRITICAL: Ensure reconnection works properly
            connectTimeout: 45000,   // 45s connection timeout
        });

        // Set up event handlers
        this.setupEventHandlers();

        logger.info("✅ Socket.IO server initialized");
    }

    /**
     * Set up Socket.IO event handlers
     */
    private setupEventHandlers(): void {
        if (!this.io) return;

        this.io.on("connection", (socket: Socket) => {
            logger.info(`🔌 Socket connected: ${socket.id}`);

            // Handle display registration (DisplayPage joins room)
            socket.on("register", (domain: string) => {
                this.handleDisplayRegister(socket, domain);
            });

            // Handle broadcast request (HomePage triggers update)
            socket.on("broadcastUpdate", (event: UpdateEvent) => {
                this.handleBroadcastUpdate(event);
            });

            // Handle disconnection
            socket.on("disconnect", (reason: string) => {
                this.handleDisconnect(socket, reason);
            });

            // Handle reconnection
            socket.on("reconnect", (attemptNumber: number) => {
                logger.info(`🔄 Socket reconnected: ${socket.id} after ${attemptNumber} attempts`);
            });

            // Handle errors
            socket.on("error", (error: Error) => {
                logger.error(`❌ Socket error: ${socket.id}`, error);
            });
        });
    }

    /**
     * Handle DisplayPage registration
     * DisplayPage joins a room based on its domain
     */
    private handleDisplayRegister(socket: Socket, domain: string): void {
        if (!domain) {
            logger.warn(`⚠️ Socket ${socket.id} tried to register without domain`);
            return;
        }

        // Join the domain room
        socket.join(domain);

        // Track connection
        if (!this.connectedDisplays.has(domain)) {
            this.connectedDisplays.set(domain, new Set());
        }
        this.connectedDisplays.get(domain)?.add(socket.id);

        // Store domain in socket data for cleanup
        socket.data.domain = domain;

        logger.info(`📺 Display registered: ${socket.id} → domain: ${domain}`);
        logger.info(`   Active displays in "${domain}": ${this.connectedDisplays.get(domain)?.size}`);

        // Send confirmation to client
        socket.emit("registered", {
            domain,
            timestamp: Date.now(),
            message: "Successfully registered to receive updates"
        });
    }

    /**
     * Handle broadcast update request from HomePage
     * Broadcasts update to all displays in the target domain
     */
    private handleBroadcastUpdate(event: UpdateEvent): void {
        if (!this.io) return;

        const { type, domain, timestamp, source, data } = event;

        logger.info(`📡 Broadcasting update: type="${type}", domain="${domain}", source="${source}"`);

        // Check if broadcasting to all domains (special case for system-wide events like force-logout)
        if (domain === "all") {
            logger.info(`   🌐 Broadcasting to ALL domains (system-wide event)`);
            
            // Emit to all connected sockets regardless of domain
            this.io.emit("update", {
                type,
                timestamp: timestamp || Date.now(),
                source,
                data
            });

            // Count total displays across all domains
            let totalDisplays = 0;
            this.connectedDisplays.forEach((socketSet) => {
                totalDisplays += socketSet.size;
            });

            logger.info(`   ✅ System-wide update broadcast to ALL domains (${totalDisplays} total displays)`);
        } else {
            // Emit to all sockets in the specific domain room
            this.io.to(domain).emit("update", {
                type,
                timestamp: timestamp || Date.now(),
                source,
                data
            });

            logger.info(`   ✅ Update broadcast to domain "${domain}" (${this.connectedDisplays.get(domain)?.size || 0} displays)`);
        }
    }

    /**
     * Handle socket disconnection
     */
    private handleDisconnect(socket: Socket, reason: string): void {
        const domain = socket.data.domain;

        logger.info(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);

        if (domain && this.connectedDisplays.has(domain)) {
            this.connectedDisplays.get(domain)?.delete(socket.id);

            // Clean up empty domain sets
            if (this.connectedDisplays.get(domain)?.size === 0) {
                this.connectedDisplays.delete(domain);
            }

            logger.info(`   Active displays in "${domain}": ${this.connectedDisplays.get(domain)?.size || 0}`);
        }
    }

    /**
     * Manually broadcast update (for server-side triggers)
     */
    public broadcastUpdate(event: UpdateEvent): void {
        if (!this.io) {
            logger.warn("Cannot broadcast: Socket.IO not initialized");
            return;
        }

        this.handleBroadcastUpdate(event);
    }

    /**
     * Get connected displays count for a domain
     */
    public getConnectedDisplays(domain: string): number {
        return this.connectedDisplays.get(domain)?.size || 0;
    }

    /**
     * Get all connected domains
     */
    public getConnectedDomains(): string[] {
        return Array.from(this.connectedDisplays.keys());
    }

    /**
     * Get Socket.IO server instance (for advanced usage)
     */
    public getIO(): SocketIOServer | null {
        return this.io;
    }

    /**
     * Shutdown Socket.IO server
     */
    public shutdown(): void {
        if (this.io) {
            logger.info("🔌 Shutting down Socket.IO server...");
            this.io.close();
            this.io = null;
            this.connectedDisplays.clear();
            logger.info("✅ Socket.IO server shut down");
        }
    }
}

// Export singleton instance
export const socketManager = new SocketManager();

/**
 * Helper function to broadcast update from anywhere in the backend
 */
export const broadcastDisplayUpdate = (event: UpdateEvent): void => {
    socketManager.broadcastUpdate(event);
};

