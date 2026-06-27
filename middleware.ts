import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Grab the active session cookie from the browser incoming request
  const sessionToken = request.cookies.get("__session")?.value;
  const { pathname } = request.nextUrl;

  // 2. Add /welcome to the explicit Public Bypass List
  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/welcome");
  
  const isPublicAsset = 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api") || 
    pathname.endsWith(".png") || 
    pathname.endsWith(".jpg") || 
    pathname.endsWith(".ico");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  // 3. If the user is unauthenticated and tries to access locked dashboard areas, bounce to gate
  if (!sessionToken && !isAuthPage) {
    const loginUrl = new URL("/signin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If they are signed in and try to hit /signin, route them to dashboard root
  if (sessionToken && pathname.startsWith("/signin")) {
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Allow the request to pass through unimpeded
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};