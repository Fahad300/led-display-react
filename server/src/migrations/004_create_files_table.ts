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
                        name: "data",
                        type: "longtext",
                        isNullable: false
                    },
                    {
                        name: "size",
                        type: "int",
                        isNullable: false
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "uploaded_by",
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

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            "files",
            new TableForeignKey({
                columnNames: ["uploaded_by"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );

        // Add indexes
        await queryRunner.query(`CREATE INDEX idx_files_uploaded_by ON files(uploaded_by)`);
        await queryRunner.query(`CREATE INDEX idx_files_created_at ON files(createdAt)`);
        await queryRunner.query(`CREATE INDEX idx_files_mime_type ON files(mimeType)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("files");
    }
}
