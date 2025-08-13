// lib/db/index.ts
import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import type { DB } from './types' // 这个文件将由 codegen 生成

const dialect = new PostgresDialect({
    pool: new Pool({
        connectionString: process.env.DATABASE_URL,
    }),
})

// Kysely 实例，提供了类型安全的查询方法
export const db = new Kysely<DB>({
    dialect,
})