// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/admin/users(.*)']);

// 1. Remove the 'async' keyword here
export default clerkMiddleware((auth, req) => {
    // 2. Access sessionClaims directly from the auth object without await
    const { sessionClaims } = auth;
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;

    // The rest of your logic is correct
    // 保护 SuperAdmin 路由
    if (isSuperAdminRoute(req) && userRole !== 'SuperAdmin') {
        const homeUrl = new URL('/', req.url);
        return NextResponse.redirect(homeUrl);
    }

    // 保护 Admin 路由
    if (isAdminRoute(req) && userRole !== 'Admin' && userRole !== 'SuperAdmin') {
        const homeUrl = new URL('/', req.url);
        return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};