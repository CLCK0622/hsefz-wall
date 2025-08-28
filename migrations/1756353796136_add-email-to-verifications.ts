import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.addColumn('manual_verifications', {
        requested_email: { type: 'varchar(255)' }
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropColumn('manual_verifications', 'requested_email');
}