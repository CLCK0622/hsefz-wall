import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.addColumn('posts', {
        is_anonymous: { type: 'boolean', notNull: true, default: false }
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropColumn('posts', 'is_anonymous');
}