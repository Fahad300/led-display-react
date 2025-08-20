import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateSessionsTable1700000000003 implements MigrationInterface {
    name = 'CreateSessionsTable1700000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                        name: "sessionToken",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                        isUnique: true
                    },
                    {
                        name: "userId",
                        type: "varchar",
                        length: "36",
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
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "deviceInfo",
                        type: "text",
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

        // Add foreign key constraint for userId
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("sessions");
    }
}
