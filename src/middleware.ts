import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This console log will help confirm if the middleware is running
  console.log('Minimal middleware executed for path:', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all routes for testing, except for Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};