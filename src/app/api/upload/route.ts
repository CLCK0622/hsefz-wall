// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename || !request.body) {
        return new NextResponse('Missing filename or request body', { status: 400 });
    }

    // 这里的 blob 就是上传后的文件信息，包含了 url
    const blob = await put(filename, request.body, {
        access: 'public',
    });

    return NextResponse.json(blob);
}