import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDisplaysTable1700000000002 implements MigrationInterface {
    name = 'CreateDisplaysTable1700000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
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

        // Add indexes
        await queryRunner.query(`CREATE INDEX idx_displays_created_by ON displays(created_by)`);
        await queryRunner.query(`CREATE INDEX idx_displays_is_active ON displays(isActive)`);
        await queryRunner.query(`CREATE INDEX idx_displays_type ON displays(type)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("displays");
    }
}
