import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware for Better Auth session validation with dual-tier permission system
 * 
 * EDGE RUNTIME SOLUTION: Instead of using Better Auth directly in middleware
 * (which has Prisma compatibility issues), we use cookie-based session validation
 * by making a fetch request to our own API route that uses the full Better Auth config.
 * 
 * DUAL-TIER PROTECTION:
 * 1. System-level routes (/api/system/*): require user.role = 'admin'
 * 2. Organization-level routes (/api/organizations/*): require organization membership
 * 
 * This approach:
 * 1. Avoids Prisma in Edge Runtime
 * 2. Maintains Better Auth session validation
 * 3. Supports both system admin and organization-scoped access control
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth', '/set-username', '/api/session-check', '/accept-invitation', '/api/create-admin', '/debug'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    // Use internal API route for session validation to avoid Edge Runtime issues
    const sessionResponse = await fetch(`${request.nextUrl.origin}/api/session-check`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    if (!sessionResponse.ok) {
      // No valid session, redirect to login for pages or return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const sessionData = await sessionResponse.json();
    const userRole = sessionData?.user?.role;
    
    // SYSTEM-LEVEL ROUTE PROTECTION
    // Routes starting with /api/system/* require system admin privileges
    if (pathname.startsWith('/api/system/')) {
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: "System admin privileges required" },
          { status: 403 }
        );
      }
      return NextResponse.next();
    }
    
    // ORGANIZATION-LEVEL ROUTE PROTECTION
    // Routes starting with /api/organizations/* require organization membership
    // System admins have override access to all organization data
    if (pathname.startsWith('/api/organizations/')) {
      // System admins can access all organization routes
      if (userRole === 'admin') {
        return NextResponse.next();
      }
      
      // Regular users need organization membership validation
      // This validation happens in the individual API route handlers
      // as it requires checking specific organization membership
      return NextResponse.next();
    }
    
    // ADMIN DASHBOARD PROTECTION
    // System admin specific dashboard routes
    if (pathname.startsWith('/dashboard/admin/')) {
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: "System admin privileges required" },
          { status: 403 }
        );
      }
      return NextResponse.next();
    }
    
    // Redirect authenticated users from root to dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
    
  } catch (error) {
    // Session validation failed
    console.error("Session validation error:", error);
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: "Session validation failed" },
        { status: 500 }
      );
    }
    
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Optimize matcher to follow Next.js recommendations
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     * 
     * Include API routes for system-level protection
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
