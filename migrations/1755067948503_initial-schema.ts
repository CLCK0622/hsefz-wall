// migrations/xxxxxxxx_initial_schema.ts
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // 用户表
    pgm.createTable('users', {
        id: 'id', // 默认是 SERIAL PRIMARY KEY
        clerk_id: { type: 'varchar(255)', notNull: true, unique: true },
        username: { type: 'varchar(255)', notNull: true },
        email: { type: 'varchar(255)', notNull: true, unique: true },
        avatar_url: { type: 'text' },
        role: { type: 'varchar(50)', notNull: true, default: 'user' }, // 'user' or 'admin'
        is_verified: { type: 'boolean', notNull: true, default: false }, // 是否通过邮箱或手动验证
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // 帖子表
    pgm.createTable('posts', {
        id: 'id',
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        content: { type: 'text', notNull: true },
        is_announcement: { type: 'boolean', notNull: true, default: false },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        }
    });

    // 帖子图片表
    pgm.createTable('post_images', {
        id: 'id',
        post_id: {
            type: 'integer',
            notNull: true,
            references: '"posts"(id)',
            onDelete: 'CASCADE',
        },
        image_url: { type: 'text', notNull: true },
        order: { type: 'integer', notNull: true }, // 图片顺序
    });

    // 评论表
    pgm.createTable('comments', {
        id: 'id',
        post_id: {
            type: 'integer',
            notNull: true,
            references: '"posts"(id)',
            onDelete: 'CASCADE',
        },
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        content: { type: 'text', notNull: true },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        }
    });

    // 点赞表 (使用复合主键确保一人一赞)
    pgm.createTable('likes', {
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        post_id: {
            type: 'integer',
            notNull: true,
            references: '"posts"(id)',
            onDelete: 'CASCADE',
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.addConstraint('likes', 'likes_pkey', { primaryKey: ['user_id', 'post_id'] });


    // 举报表
    pgm.createTable('reports', {
        id: 'id',
        reporter_user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'SET NULL',
        },
        post_id: { type: 'integer', references: '"posts"(id)', onDelete: 'CASCADE' },
        comment_id: { type: 'integer', references: '"comments"(id)', onDelete: 'CASCADE' },
        reason: { type: 'text', notNull: true },
        status: { type: 'varchar(50)', notNull: true, default: 'pending' }, // 'pending', 'resolved', 'dismissed'
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // 手动验证请求表
    pgm.createTable('manual_verifications', {
        id: 'id',
        user_id: { // 这里的 user_id 是指我们自己 user 表的 id
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        clerk_user_id: { type: 'varchar(255)', notNull: true, unique: true }, // clerk ID 用于 API 操作
        details_text: { type: 'text' },
        image_url: { type: 'text' }, // 校园卡照片URL
        status: { type: 'varchar(50)', notNull: true, default: 'pending' }, // 'pending', 'approved', 'rejected'
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

}

export async function down(pgm: MigrationBuilder): Promise<void> {
    // 按相反的顺序删除表
    pgm.dropTable('manual_verifications');
    pgm.dropTable('reports');
    pgm.dropTable('likes');
    pgm.dropTable('comments');
    pgm.dropTable('post_images');
    pgm.dropTable('posts');
    pgm.dropTable('users');
}