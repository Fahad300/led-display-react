import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateSessionsTable1700000000003 implements MigrationInterface {
    name = 'CreateSessionsTable1700000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
<<<<<<< HEAD
        await queryRunner.createTable(
            new Table({
                name: "sessions",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "36",
                        isPrimary: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "userId",
                        type: "varchar",
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "sessionToken",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                        isNullable: false
                    },
                    {
                        name: "displaySettings",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "slideData",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "appSettings",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "isActive",
                        type: "boolean",
                        default: true
                    },
                    {
                        name: "lastActivity",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "deviceInfo",
                        type: "varchar",
                        length: "500",
                        isNullable: true
                    },
                    {
                        name: "ipAddress",
                        type: "varchar",
                        length: "45",
                        isNullable: true
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            "sessions",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );

        // Add indexes
        await queryRunner.query(`CREATE INDEX idx_sessions_user_id ON sessions(userId)`);
        await queryRunner.query(`CREATE INDEX idx_sessions_token ON sessions(sessionToken)`);
        await queryRunner.query(`CREATE INDEX idx_sessions_is_active ON sessions(isActive)`);
=======
        // Check if sessions table already exists
        const tableExists = await queryRunner.hasTable("sessions");

        if (!tableExists) {
            await queryRunner.createTable(
                new Table({
                    name: "sessions",
                    columns: [
                        {
                            name: "id",
                            type: "varchar",
                            length: "36",
                            isPrimary: true,
                            generationStrategy: "uuid"
                        },
                        {
                            name: "userId",
                            type: "varchar",
                            length: "36",
                            isNullable: false
                        },
                        {
                            name: "sessionToken",
                            type: "varchar",
                            length: "255",
                            isUnique: true,
                            isNullable: false
                        },
                        {
                            name: "isActive",
                            type: "boolean",
                            default: true
                        },
                        {
                            name: "expiresAt",
                            type: "timestamp",
                            isNullable: false
                        },
                        {
                            name: "createdAt",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP"
                        },
                        {
                            name: "updatedAt",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP",
                            onUpdate: "CURRENT_TIMESTAMP"
                        }
                    ]
                }),
                true
            );
        }

        // Check if foreign key already exists
        const foreignKeys = await queryRunner.getTable("sessions");
        const fkExists = foreignKeys?.foreignKeys.some(fk =>
            fk.columnNames.includes("userId") && fk.referencedTableName === "users"
        );

        if (!fkExists) {
            // Add foreign key constraint
            await queryRunner.createForeignKey(
                "sessions",
                new TableForeignKey({
                    columnNames: ["userId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "CASCADE"
                })
            );
        }

        // Add indexes for better performance
        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(userId)`);
        } catch (error) {
            // Index might already exist, continue
        }

        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(sessionToken)`);
        } catch (error) {
            // Index might already exist, continue
        }

        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(isActive)`);
        } catch (error) {
            // Index might already exist, continue
        }
>>>>>>> a46cf8ac23aba6c39fb14cf40a636d87d37b56cc
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("sessions");
    }
}
