// migrations/xxxxxxxx_fix_timestamp_columns.ts
import { MigrationBuilder } from 'node-pg-migrate';

// --- UP Migration ---
export async function up(pgm: MigrationBuilder): Promise<void> {
    console.log('Converting timestamp columns to timestamptz...');

    // Posts Table
    pgm.alterColumn('posts', 'created_at', { type: 'timestamptz', using: `"created_at" AT TIME ZONE 'UTC'`, default: pgm.func('now()') });
    pgm.alterColumn('posts', 'updated_at', { type: 'timestamptz', using: `"updated_at" AT TIME ZONE 'UTC'`, default: pgm.func('now()') });

    // Comments Table
    pgm.alterColumn('comments', 'created_at', { type: 'timestamptz', using: `"created_at" AT TIME ZONE 'UTC'`, default: pgm.func('now()') });
    pgm.alterColumn('comments', 'updated_at', { type: 'timestamptz', using: `"updated_at" AT TIME ZONE 'UTC'`, default: pgm.func('now()') });

    // Likes Table
    pgm.alterColumn('likes', 'created_at', { type: 'timestamptz', using: `"created_at" AT TIME ZONE 'UTC'`, default: pgm.func('now()') });

    // Reports Table
    pgm.alterColumn('reports', 'created_at', { type: 'timestamptz', using: `"created_at" AT TIME ZONE 'UTC'`, default: pgm.func('now()') });

    // Manual Verifications Table
    pgm.alterColumn('manual_verifications', 'created_at', { type: 'timestamptz', using: `"created_at" AT TIME ZONE 'UTC'`, default: pgm.func('now()') });

    console.log('Conversion complete.');
}

// --- DOWN Migration (for rollback) ---
export async function down(pgm: MigrationBuilder): Promise<void> {
    console.log('Reverting timestamptz columns to timestamp...');

    // Posts Table
    pgm.alterColumn('posts', 'created_at', { type: 'timestamp', using: `"created_at" AT TIME ZONE 'UTC'`, default: pgm.func('current_timestamp') });
    pgm.alterColumn('posts', 'updated_at', { type: 'timestamp', using: `"updated_at" AT TIME ZONE 'UTC'`, default: pgm.func('current_timestamp') });

    // ... (similar conversions for other tables if you need a complete down migration)

    console.log('Revert complete.');
}