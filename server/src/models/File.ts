import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { getFileUrl } from "../utils/urlUtils";

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
     * Returns relative URL to work in any environment (dev/production)
     */
    getUrl(): string {
        // Return relative URL - browser will use current origin
        // This works in both development and production
        return `/api/files/${this.id}`;
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