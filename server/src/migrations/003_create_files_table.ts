import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFilesTable1700000000003 implements MigrationInterface {
    name = "CreateFilesTable1700000000003";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE files (
                id VARCHAR(36) PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                originalName VARCHAR(255) NOT NULL,
                mimeType VARCHAR(100) NOT NULL,
                data LONGTEXT NOT NULL,
                size INT NOT NULL,
                description TEXT NULL,
                uploaded_by VARCHAR(36) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS files`);
    }
}
