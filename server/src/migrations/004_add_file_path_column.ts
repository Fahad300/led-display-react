import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddFilePathColumn1700000000004 implements MigrationInterface {
    name = "AddFilePathColumn1700000000004";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("files", new TableColumn({
            name: "filePath",
            type: "varchar",
            length: "500",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("files", "filePath");
    }
}
