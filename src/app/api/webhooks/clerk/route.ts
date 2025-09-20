// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', { status: 400 })
    }

    const payload = await req.json()
    const body = JSON.stringify(payload);
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
        return new Response('Error occured', { status: 400 })
    }

    const eventType = evt.type;

    // --- 处理用户创建 ---
    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;
        const email = email_addresses[0].email_address;
        const username = `${last_name || ''}${first_name || ''}`.trim() || email.split('@')[0];

        await db.insertInto('users').values({
            clerk_id: id,
            email: email,
            username: username,
            avatar_url: image_url,
            role: (public_metadata.role as string) || 'User',
        }).execute();
    }

    // --- 处理用户更新 (包括邮箱验证成功) ---
    if (eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;
        const username = `${last_name || ''}${first_name || ''}`.trim();

        // 检查是否有任何一个邮箱刚刚被验证成功
        const isVerifiedNow = email_addresses.some(email =>
            email.verification?.status === 'verified'
        );

        await db.updateTable('users').set({
            ...(username ? { username } : {}),
            avatar_url: image_url,
            role: (public_metadata.role as string) || 'User',
            // 如果有邮箱被验证成功，就更新 is_verified 字段
            ...(isVerifiedNow ? { is_verified: true } : {}),
        }).where('clerk_id', '=', id).execute();
    }

    // --- 处理用户删除 ---
    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        if (id) {
            await db.deleteFrom('users').where('clerk_id', '=', id).execute();
        }
    }

    // --- 处理邮件发送请求 ---
    if (eventType === 'email.created') {
        const emailData = evt.data;
        // 直接从 webhook payload 中尝试获取 otp_code
        const otpCode = (emailData as any).otp_code;

        try {
            await sendEmail({
                to: emailData.to_email_address || '',
                subject: emailData.subject || '来自张江多功能墙的邮件',
                html: emailData.body || '<p>你好！这是一封来自张江多功能墙的邮件。</p>',
                otp_code: otpCode,
            });
        } catch (error) {
            console.error('Failed to send email:', error);
            return new Response('Error sending email', { status: 500 });
        }
    }

    return new Response('OK', { status: 200 });
}