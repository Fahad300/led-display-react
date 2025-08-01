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
    displaySettings!: string; // JSON string of display settings

    @Column({ type: "text", nullable: true })
    slideData!: string; // JSON string of slide configurations

    @Column({ type: "text", nullable: true })
    appSettings!: string; // JSON string of app settings

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
    getDisplaySettings(): any {
        try {
            return this.displaySettings ? JSON.parse(this.displaySettings) : {};
        } catch {
            return {};
        }
    }

    setDisplaySettings(settings: any): void {
        this.displaySettings = JSON.stringify(settings);
    }

    getSlideData(): any {
        try {
            return this.slideData ? JSON.parse(this.slideData) : [];
        } catch {
            return [];
        }
    }

    setSlideData(slides: any): void {
        this.slideData = JSON.stringify(slides);
    }

    getAppSettings(): any {
        try {
            return this.appSettings ? JSON.parse(this.appSettings) : {};
        } catch {
            return {};
        }
    }

    setAppSettings(settings: any): void {
        this.appSettings = JSON.stringify(settings);
    }
} 