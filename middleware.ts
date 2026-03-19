import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  const publicRoutes = [
    "/",
    "/login",
  ];

  // Allow API & static
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // If user has token
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET!
      );

      await jwtVerify(token, secret);

      if (pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // If no token and trying to access protected route
  if (!publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
