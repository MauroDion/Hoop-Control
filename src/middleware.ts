import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin'; // Import adminAuth for verification

// Helper function to check if the user is authenticated via session cookie
async function isAuthenticatedViaSession(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get('session')?.value;
  const pathname = request.nextUrl.pathname;

  console.log(`Middleware (isAuthenticatedViaSession): Verificando para la ruta '${pathname}'. Buscando cookie 'session'.`);

  if (!sessionCookie) {
    console.log(`Middleware (isAuthenticatedViaSession): Cookie 'session' NO encontrada. Usuario NO autenticado.`);
    return false;
  }

  try {
    // Verify the session cookie. True to check if revoked.
    await adminAuth.verifySessionCookie(sessionCookie, true);
    console.log(`Middleware (isAuthenticatedViaSession): Cookie 'session' VÁLIDA. Usuario AUTENTICADO.`);
    return true;
  } catch (error: any) {
    console.warn(`Middleware (isAuthenticatedViaSession): Cookie 'session' INVÁLIDA o REVOCADA (Error: ${error.code || error.message}). Usuario NO autenticado.`);
    // Clear the invalid cookie by returning a response that sets it to expire
    // This will be handled by redirecting and the logout route could also clear it.
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullRequestedPath = `${pathname}${search}`;

  console.log(`\nMiddleware: Procesando petición para: ${fullRequestedPath}`);

  const publicPaths = ['/login', '/register', '/reset-password', '/'];
  // API routes for auth should also be public (or handled differently if they require auth for some actions)
  const authApiPaths = ['/api/auth/session-login', '/api/auth/session-logout'];

  if (publicPaths.includes(pathname) || authApiPaths.includes(pathname)) {
    console.log(`Middleware: La ruta '${pathname}' es pública o de API de autenticación. Permitiendo acceso.`);
    return NextResponse.next();
  }

  const authenticated = await isAuthenticatedViaSession(request);

  if (authenticated) {
    if (pathname === '/login' || pathname === '/register') {
      console.log(`Middleware: Usuario AUTENTICADO (session cookie) intentando acceder a '${pathname}'. Redirigiendo a /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    console.log(`Middleware: Usuario AUTENTICADO (session cookie). Permitiendo acceso a la ruta protegida: '${pathname}'.`);
    return NextResponse.next();
  } else {
    // User is not authenticated, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', fullRequestedPath);
    
    // If an invalid session cookie was found, we should clear it.
    // Redirecting to login is one way, another is to clear it directly here.
    const response = NextResponse.redirect(loginUrl);
    if (request.cookies.get('session')?.value) {
        console.log(`Middleware: Usuario NO AUTENTICADO (session cookie inválida/ausente). Redirigiendo a: ${loginUrl.toString()} y limpiando cookie 'session'.`);
        response.cookies.set({
            name: 'session',
            value: '',
            maxAge: 0,
            path: '/',
        });
    } else {
        console.log(`Middleware: Usuario NO AUTENTICADO (session cookie ausente). Redirigiendo a: ${loginUrl.toString()}`);
    }
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!api/public|_next/static|_next/image|favicon.ico).*)', // Protect most routes
    // Ensure API auth routes are excluded if they don't need protection or handled differently
    // The logic inside the middleware now explicitly allows authApiPaths
  ],
};
