import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/login must always be reachable, otherwise a logged-out visitor
  // could never reach the login page (redirect loop).
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const session = await auth.api.getSession({ headers: request.headers });
    const role = session?.user?.role;

    if (role !== "owner" && role !== "employee") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (pathname.startsWith("/admin/employees") && role !== "owner") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*", "/account/:path*"],
};
