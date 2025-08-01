import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

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

    @Column("longtext")
    data!: string; // Base64 encoded file data

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
     * Get file URL for serving
     */
    getUrl(): string {
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