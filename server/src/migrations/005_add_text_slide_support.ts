import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration to add Text slide support to the Display model
 * This migration ensures that Text slides can be properly stored and retrieved
 * from the database for remote display access
 */
export class AddTextSlideSupport1700000000005 implements MigrationInterface {
    name = "AddTextSlideSupport1700000000005";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The Display model already supports "text" type, so no structural changes needed
        // This migration is for documentation and future extensibility

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No rollback needed as no schema changes were made

    }
}
