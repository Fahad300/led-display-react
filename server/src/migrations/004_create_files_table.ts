import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateFilesTable1700000000004 implements MigrationInterface {
    name = 'CreateFilesTable1700000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "files",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "36",
                        isPrimary: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "filename",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "originalName",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "mimeType",
                        type: "varchar",
                        length: "100",
                        isNullable: false
                    },
                    {
                        name: "size",
                        type: "bigint",
                        isNullable: false
                    },
                    {
                        name: "path",
                        type: "varchar",
                        length: "500",
                        isNullable: false
                    },
                    {
                        name: "uploadedBy",
                        type: "varchar",
                        length: "36",
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

        // Add foreign key constraint for uploadedBy
        await queryRunner.createForeignKey(
            "files",
            new TableForeignKey({
                columnNames: ["uploadedBy"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );

        // Add indexes
        await queryRunner.query(`CREATE INDEX idx_files_uploaded_by ON files(uploadedBy)`);
        await queryRunner.query(`CREATE INDEX idx_files_mime_type ON files(mimeType)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("files");
    }
}
