// migrations/xxxxxxxx_remove_unique_constraint_from_verifications.ts
import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    // 移除 clerk_user_id 上的唯一约束
    pgm.dropConstraint('manual_verifications', 'manual_verifications_clerk_user_id_key');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    // （可选的回滚操作）重新添加唯一约束
    pgm.addConstraint('manual_verifications', 'manual_verifications_clerk_user_id_key', {
        unique: 'clerk_user_id'
    });
}