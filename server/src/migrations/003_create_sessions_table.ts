import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateSessionsTable1700000000003 implements MigrationInterface {
    name = 'CreateSessionsTable1700000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("sessions");
    }
}
