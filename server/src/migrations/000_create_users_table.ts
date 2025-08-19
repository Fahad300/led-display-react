import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersTable1700000000000 implements MigrationInterface {
    name = 'CreateUsersTable1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if users table already exists
        const tableExists = await queryRunner.hasTable("users");

        if (!tableExists) {
            await queryRunner.createTable(
                new Table({
                    name: "users",
                    columns: [
                        {
                            name: "id",
                            type: "varchar",
                            length: "36",
                            isPrimary: true,
                            generationStrategy: "uuid"
                        },
                        {
                            name: "username",
                            type: "varchar",
                            length: "255",
                            isUnique: true,
                            isNullable: false
                        },
                        {
                            name: "password",
                            type: "varchar",
                            length: "255",
                            isNullable: false
                        },
                        {
                            name: "createdAt",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP"
                        }
                    ]
                }),
                true
            );
        }

        // Add indexes for better performance
        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
        } catch (error) {
            // Index might already exist, continue
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users");
    }
}
