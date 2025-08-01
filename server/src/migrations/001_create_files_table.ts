import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateFilesTable1700000000001 implements MigrationInterface {
    name = 'CreateFilesTable1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if files table already exists
        const tableExists = await queryRunner.hasTable("files");

        if (!tableExists) {
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
        }

        // Check if foreign key already exists
        const foreignKeys = await queryRunner.getTable("files");
        const fkExists = foreignKeys?.foreignKeys.some(fk =>
            fk.columnNames.includes("uploaded_by") && fk.referencedTableName === "users"
        );

        if (!fkExists) {
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
        }

        // Add indexes for better performance (with IF NOT EXISTS check)
        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by)`);
        } catch (error) {
            // Index might already exist, continue
        }

        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(createdAt)`);
        } catch (error) {
            // Index might already exist, continue
        }

        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mimeType)`);
        } catch (error) {
            // Index might already exist, continue
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("files");
    }
} 