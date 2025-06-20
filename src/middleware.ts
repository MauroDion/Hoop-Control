
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Marcador de posición para la lógica relacionada con la autenticación
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const sessionCookieName = 'firebaseIdToken'; // Nombre de la cookie que buscamos
  const sessionCookie = request.cookies.get(sessionCookieName)?.value;

  console.log(`Middleware: isAuthenticated: Buscando cookie '${sessionCookieName}' para la ruta ${request.nextUrl.pathname}.`);

  if (sessionCookie) {
    // En una aplicación real, verificarías la validez del token en la cookie.
    // Por ahora, la presencia de la cookie implica autenticación para el middleware.
    console.log(`Middleware: isAuthenticated: Cookie '${sessionCookieName}' ENCONTRADA.`);
    return true;
  }
  console.log(`Middleware: isAuthenticated: Cookie '${sessionCookieName}' NO encontrada.`);
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`Middleware: Petición entrante para la ruta: ${pathname}`);

  // Definir rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register', '/reset-password', '/'];

  // Si la ruta es una de las rutas públicas definidas, permitir el acceso directamente
  if (publicPaths.includes(pathname)) {
    console.log(`Middleware: Ruta pública (coincidencia exacta): ${pathname}. Permitiendo acceso.`);
    return NextResponse.next();
  }

  // Comprobar si el usuario está autenticado según el middleware
  const authenticatedByMiddleware = await isAuthenticated(request);
  console.log(`Middleware: Ruta ${pathname}, estado de autenticación (según cookie '${'firebaseIdToken'}'): ${authenticatedByMiddleware}`);

  // Si el usuario está autenticado según el middleware:
  if (authenticatedByMiddleware) {
    // Si un usuario autenticado intenta acceder a login o register, redirigir al dashboard
    if (pathname === '/login' || pathname === '/register') {
      console.log(`Middleware: Usuario autenticado (cookie) en página de auth, redirigiendo a /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Para otras rutas, permitir el acceso
    console.log(`Middleware: Usuario autenticado (cookie), procediendo para la ruta: ${pathname}`);
    return NextResponse.next();
  }

  // Si el usuario NO está autenticado según el middleware:
  // Y está intentando acceder a una ruta protegida (es decir, no es una publicPath)
  // Redirigir a login, preservando el destino previsto.
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  console.log(`Middleware: No autenticado (cookie) para ruta protegida '${pathname}', redirigiendo a ${loginUrl.toString()}`);
  return NextResponse.redirect(loginUrl);

  // Fallback, idealmente no se alcanzaría si la lógica anterior es exhaustiva
  // return NextResponse.next(); // Comentado ya que la lógica de redirección debería cubrir todos los casos no públicos
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas, excepto a los internos de Next.js y archivos específicos
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
