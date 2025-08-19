import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDisplaysTable1700000000002 implements MigrationInterface {
    name = 'CreateDisplaysTable1700000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if displays table already exists
        const tableExists = await queryRunner.hasTable("displays");

        if (!tableExists) {
            await queryRunner.createTable(
                new Table({
                    name: "displays",
                    columns: [
                        {
                            name: "id",
                            type: "varchar",
                            length: "36",
                            isPrimary: true,
                            generationStrategy: "uuid"
                        },
                        {
                            name: "name",
                            type: "varchar",
                            length: "255",
                            isNullable: false
                        },
                        {
                            name: "description",
                            type: "text",
                            isNullable: true
                        },
                        {
                            name: "type",
                            type: "varchar",
                            length: "50",
                            isNullable: false
                        },
                        {
                            name: "content",
                            type: "json",
                            isNullable: false
                        },
                        {
                            name: "settings",
                            type: "json",
                            isNullable: false
                        },
                        {
                            name: "isActive",
                            type: "boolean",
                            default: true
                        },
                        {
                            name: "created_by",
                            type: "varchar",
                            length: "36",
                            isNullable: false
                        },
                        {
                            name: "updatedById",
                            type: "varchar",
                            length: "36",
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
        }

        // Check if foreign key already exists for created_by
        const foreignKeys = await queryRunner.getTable("displays");
        const fkCreatedByExists = foreignKeys?.foreignKeys.some(fk =>
            fk.columnNames.includes("created_by") && fk.referencedTableName === "users"
        );

        if (!fkCreatedByExists) {
            // Add foreign key constraint for created_by
            await queryRunner.createForeignKey(
                "displays",
                new TableForeignKey({
                    columnNames: ["created_by"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "CASCADE"
                })
            );
        }

        // Check if foreign key already exists for updatedById
        const fkUpdatedByExists = foreignKeys?.foreignKeys.some(fk =>
            fk.columnNames.includes("updatedById") && fk.referencedTableName === "users"
        );

        if (!fkUpdatedByExists) {
            // Add foreign key constraint for updatedBy
            await queryRunner.createForeignKey(
                "displays",
                new TableForeignKey({
                    columnNames: ["updatedById"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "SET NULL"
                })
            );
        }

        // Add indexes for better performance
        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_displays_created_by ON displays(created_by)`);
        } catch (error) {
            // Index might already exist, continue
        }

        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_displays_is_active ON displays(isActive)`);
        } catch (error) {
            // Index might already exist, continue
        }

        try {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_displays_type ON displays(type)`);
        } catch (error) {
            // Index might already exist, continue
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("displays");
    }
}
