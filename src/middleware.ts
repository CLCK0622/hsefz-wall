// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/clerk'
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/admin/users(.*)']);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // 1. To PROTECT a route, call the .protect() method on the auth object.
    // This will handle redirecting unauthenticated users.
    await auth.protect();

    // 2. To GET USER DATA, call the auth object as a function.
    const { sessionClaims } = await auth();
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;

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