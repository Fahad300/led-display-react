import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { getFileUrl, getBackendUrl } from "../utils/urlUtils";

@Entity("files")
export class File {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    filename!: string;

    @Column()
    originalName!: string;

    @Column()
    mimeType!: string;

    @Column()
    filePath!: string; // File system path for serving

    @Column()
    size!: number; // File size in bytes

    @Column({ nullable: true })
    description?: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "uploaded_by" })
    uploadedBy!: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    /**
     * Get file URL for serving from file system
     * Returns ABSOLUTE static file URL based on filename
     * Files are served via /static/uploads/ directory on the backend server
     * Returns absolute URL to ensure files are loaded from backend, not frontend
     */
    getUrl(): string {
        // Return ABSOLUTE URL with backend server address
        // This ensures files are loaded from the backend server (port 5000)
        // instead of the frontend server (port 3000)
        const backendUrl = getBackendUrl();
        return `${backendUrl}/static/uploads/${this.filename}`;
    }

    /**
     * Get file extension
     */
    getExtension(): string {
        return this.originalName.split('.').pop() || '';
    }

    /**
     * Check if file is an image
     */
    isImage(): boolean {
        return this.mimeType.startsWith('image/');
    }

    /**
     * Check if file is a video
     */
    isVideo(): boolean {
        return this.mimeType.startsWith('video/');
    }

    /**
     * Check if file is a document
     */
    isDocument(): boolean {
        return this.mimeType.startsWith('application/');
    }
} 