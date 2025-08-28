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
    type: "slider" | "text" | "image" | "video" | "current-escalations" | "graph" | "team-comparison" | "news" | "events";

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
        // For text slides
        textSlide?: {
            content: string;
        };
        // For current escalations
        escalations?: Array<{
            ticketCategory: string;
            teamName: string;
            clientName: string;
            ticketSummary: string;
            averageResponseTime: string;
            ticketStatus: string;
            curtentStatus: string;
        }>;
        // For graph slides
        graphData?: {
            title: string;
            description: string;
            graphType: string;
            timeRange: string;
            lastUpdated: string;
            categories: string[];
            data: Array<{
                teamName: string;
                dataPoints: Array<{
                    date: string;
                    value: number;
                    category: string;
                }>;
            }>;
        };
        // For team comparison
        teamComparison?: {
            teams: Array<{
                teamName: string;
                totalTickets: number;
                cLevelEscalations: number;
                omegaEscalations: number;
                codeBlueEscalations: number;
                averageResponseTime: string;
                averageLeadTime: string;
            }>;
            lastUpdated: string;
        };
        // For news slides
        newsItems?: Array<{
            title: string;
            content: string;
            date: string;
            category: string;
        }>;
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