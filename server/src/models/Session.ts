import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("sessions")
export class Session {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    sessionToken!: string;

    @Column()
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;

    @Column({ type: "text", nullable: true })
    slideshowData!: string; // JSON string of unified slideshow data

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    lastActivity!: Date;

    @Column({ nullable: true })
    deviceInfo!: string; // Browser/device information

    @Column({ nullable: true })
    ipAddress!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Helper methods for JSON handling
    getSlideshowData(): any {
        try {
            return this.slideshowData ? JSON.parse(this.slideshowData) : null;
        } catch {
            return null;
        }
    }

    setSlideshowData(data: any): void {
        this.slideshowData = JSON.stringify(data);
    }
} 