// middleware.ts
import {clerkClient, clerkMiddleware, createRouteMatcher, currentUser} from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/clerk'
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/admin/users(.*)']);
const isVerificationRoute = createRouteMatcher(['/verify', '/api/upload']);
const isVerificationPage = createRouteMatcher(['/verify']);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // 1. To PROTECT a route, call the .protect() method on the auth object.
    // This will handle redirecting unauthenticated users.
    await auth.protect();

    const { userId } = await auth();
    if (userId === null) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    const clerkUser = await (await clerkClient()).users.getUser(userId);

    // 从最新的、最准确的用户数据中提取信息
    const userRole = (clerkUser.publicMetadata as { role?: string })?.role;
    const isVerified = (clerkUser.publicMetadata as { verified?: boolean })?.verified;
    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;

    if (userRole !== 'Admin' && userRole !== 'SuperAdmin' && !isVerified && !primaryEmail?.endsWith('@hsefz.cn') && !isVerificationRoute(req)) {
        const verifyUrl = new URL('/verify', req.url);
        return NextResponse.redirect(verifyUrl);
    }

    if ((isVerified || userRole === 'Admin' || userRole === 'SuperAdmin') && isVerificationPage(req)) {
        const homeUrl = new URL('/', req.url);
        return NextResponse.redirect(homeUrl);
    }

    console.log(`[Middleware] Path: ${req.nextUrl.pathname}, User Role: ${userRole}`);

    // 3. Now perform the role checks on the authenticated user.
    if (isSuperAdminRoute(req) && userRole !== 'SuperAdmin') {
        console.log(`[Middleware] Access DENIED to SuperAdmin route. Role was: ${userRole}`);
        const homeUrl = new URL('/', req.url);
        return NextResponse.redirect(homeUrl);
    }

    if (isAdminRoute(req) && userRole !== 'Admin' && userRole !== 'SuperAdmin') {
        console.log(`[Middleware] Access DENIED to Admin route. Role was: ${userRole}`);
        const homeUrl = new URL('/', req.url);
        return NextResponse.redirect(homeUrl);
    }

    console.log(`[Middleware] Access GRANTED to ${req.nextUrl.pathname}`);
    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};