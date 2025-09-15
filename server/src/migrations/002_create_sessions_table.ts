import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionsTable1700000000002 implements MigrationInterface {
    name = "CreateSessionsTable1700000000002";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE sessions (
                id VARCHAR(36) PRIMARY KEY,
                sessionToken VARCHAR(255) NOT NULL,
                userId VARCHAR(36) NOT NULL,
                slideshowData TEXT NULL,
                isActive BOOLEAN DEFAULT TRUE,
                lastActivity TIMESTAMP NULL,
                deviceInfo VARCHAR(500) NULL,
                ipAddress VARCHAR(45) NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS sessions`);
    }
}
