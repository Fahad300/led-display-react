import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("employees")
export class Employee {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({ type: "date" })
    dob!: string;

    @Column()
    designation!: string;

    @Column()
    teamName!: string;

    @Column()
    picture!: string;

    @Column()
    email!: string;

    @Column()
    gender!: string;

    @Column({ type: "date" })
    dateOfJoining!: string;

    @Column({ default: false })
    isBirthday!: boolean;

    @Column({ default: false })
    isAnniversary!: boolean;
} 