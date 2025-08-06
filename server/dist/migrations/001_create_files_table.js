"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFilesTable1700000000001 = void 0;
const typeorm_1 = require("typeorm");
class CreateFilesTable1700000000001 {
    constructor() {
        this.name = 'CreateFilesTable1700000000001';
    }
    async up(queryRunner) {
        // Check if files table already exists
        const tableExists = await queryRunner.hasTable("files");
        if (!tableExists) {
            await queryRunner.createTable(new typeorm_1.Table({
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
            }), true);
        }
        // Check if foreign key already exists
        const foreignKeys = await queryRunner.getTable("files");
        const fkExists = foreignKeys?.foreignKeys.some(fk => fk.columnNames.includes("uploaded_by") && fk.referencedTableName === "users");
        if (!fkExists) {
            // Add foreign key constraint
            await queryRunner.createForeignKey("files", new typeorm_1.TableForeignKey({
                columnNames: ["uploaded_by"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            }));
        }
        // Add indexes for better performance (with IF NOT EXISTS check)
        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by)`);
        }
        catch (error) {
            // Index might already exist, continue
        }
        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(createdAt)`);
        }
        catch (error) {
            // Index might already exist, continue
        }
        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mimeType)`);
        }
        catch (error) {
            // Index might already exist, continue
        }
    }
    async down(queryRunner) {
        await queryRunner.dropTable("files");
    }
}
exports.CreateFilesTable1700000000001 = CreateFilesTable1700000000001;
