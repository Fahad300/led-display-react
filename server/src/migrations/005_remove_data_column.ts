import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RemoveDataColumn1700000000005 implements MigrationInterface {
    name = "RemoveDataColumn1700000000005";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("files", "data");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("files", new TableColumn({
            name: "data",
            type: "longtext",
            isNullable: false
        }));
    }
}
