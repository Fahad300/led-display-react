import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("displays")
export class Display {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string;

    @Column()
    type: "slider" | "text" | "image" | "video";

    @Column("simple-json")
    content: {
        text?: string;
        images?: string[];
        videos?: string[];
        sliderConfig?: {
            speed: number;
            direction: "horizontal" | "vertical";
            transition: "fade" | "slide" | "none";
        };
    };

    @Column("simple-json")
    settings: {
        width: number;
        height: number;
        backgroundColor: string;
        textColor: string;
        fontSize: number;
        fontFamily: string;
        animation: string;
    };

    @Column({ default: true })
    isActive!: boolean;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "created_by" })
    createdBy!: User;

    @ManyToOne(() => User)
    @JoinColumn()
    updatedBy: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 