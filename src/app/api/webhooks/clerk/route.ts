// app/api/webhooks/clerk/route.ts

import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db' // 引入我们创建的 Kysely 实例
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    // 从 .env.local 文件中获取 Webhook secret
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local')
    }

    // 获取请求头
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // 如果请求头不完整，返回错误
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // 获取请求体
    const payload = await req.json()
    const body = JSON.stringify(payload);

    // 创建一个 Svix webhook 实例并验证签名
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    // 根据不同的事件类型，执行不同的数据库操作
    const eventType = evt.type;

    console.log(`Webhook with an event type of ${eventType} received!`);

    // 事件：用户创建
    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        // Clerk 保证了 email_addresses[0] 存在
        const email = email_addresses[0].email_address;
        const username = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];

        // 使用 Kysely 将新用户插入数据库
        await db.insertInto('users')
            .values({
                clerk_id: id,
                email: email,
                username: username,
                avatar_url: image_url,
                // is_verified 将在邮箱验证后由另一个事件更新
            })
            .execute();

        console.log(`Created user ${id} in local database.`);
    }

    // 事件：用户更新
    if (eventType === 'user.updated') {
        const { id, first_name, last_name, image_url } = evt.data;

        const username = `${first_name || ''} ${last_name || ''}`.trim();

        // 使用 Kysely 更新用户信息
        await db.updateTable('users')
            .set({
                username: username,
                avatar_url: image_url,
            })
            .where('clerk_id', '=', id)
            .execute();

        console.log(`Updated user ${id} in local database.`);
    }

    // 事件：用户删除
    if (eventType === 'user.deleted') {
        const { id } = evt.data;

        // 如果是软删除，请确保 Clerk 的设置是 Hard delete
        // 否则这里可能需要更新一个 is_deleted 字段而不是直接删除
        await db.deleteFrom('users')
            .where('clerk_id', '=', id!)
            .execute();

        console.log(`Deleted user ${id} from local database.`);
    }

    // 事件：邮箱验证成功
    if (eventType === 'email.created') {
        // 这个事件在邮箱被验证时触发
        const { object, data } = evt as any; // 类型可能需要断言
        if (object === 'email' && data.verification?.status === 'verified') {
            const clerkUserId = data.linked_to[0]?.id;
            if (clerkUserId) {
                await db.updateTable('users')
                    .set({ is_verified: true })
                    .where('clerk_id', '=', clerkUserId)
                    .execute();
                console.log(`Verified email for user ${clerkUserId}.`);
            }
        }
    }


    return new Response('', { status: 200 })
}