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

    if (!filename) {
        return new NextResponse('Missing filename or request body', { status: 400 });
    }

    if (request.body === null) {
        return new NextResponse('No file body found in request', { status: 400 });
    }

    try {
        const blob = await put(filename, request.body, {
            access: 'public',
            // multipart: true,
            allowOverwrite: true,
        });

        return NextResponse.json(blob);
    } catch (error: any) {
        return new NextResponse(`Error uploading file: ${error.message}`, { status: 500 });
    }
}