
import { NextRequest, NextResponse } from 'next/server';

// Middleware is currently disabled to allow direct access to all pages
// during development without authentication.

export function middleware(request: NextRequest) {
  console.log(`Middleware: Bypassed for path: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  // This matcher will now effectively do nothing, but we keep the file
  // to make re-enabling it easy.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
