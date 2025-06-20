
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Marcador de posición para la lógica relacionada con la autenticación
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const sessionCookieName = 'firebaseIdToken'; // Nombre de la cookie que buscamos
  const sessionCookie = request.cookies.get(sessionCookieName)?.value;

  console.log(`Middleware (isAuthenticated): Verificando para la ruta '${request.nextUrl.pathname}'. Buscando cookie '${sessionCookieName}'.`);

  if (sessionCookie) {
    // En una aplicación real, verificarías la validez del token en la cookie.
    // Por ahora, la presencia de la cookie implica autenticación para el middleware.
    console.log(`Middleware (isAuthenticated): Cookie '${sessionCookieName}' ENCONTRADA. Usuario considerado AUTENTICADO por el middleware.`);
    return true;
  }
  console.log(`Middleware (isAuthenticated): Cookie '${sessionCookieName}' NO encontrada. Usuario considerado NO AUTENTICADO por el middleware.`);
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullRequestedPath = `${pathname}${search}`; // Incluye query params

  console.log(`\nMiddleware: Procesando petición para: ${fullRequestedPath}`);

  // Definir rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register', '/reset-password', '/'];

  // Si la ruta es una de las rutas públicas definidas, permitir el acceso directamente
  if (publicPaths.includes(pathname)) {
    console.log(`Middleware: La ruta '${pathname}' es pública. Permitiendo acceso.`);
    // Si un usuario ya autenticado (según la cookie) intenta acceder a login/register,
    // podría ser útil redirigirlo al dashboard, pero esto se maneja mejor después de la comprobación de autenticación.
    return NextResponse.next();
  }

  // Comprobar si el usuario está autenticado según el middleware
  const authenticatedByMiddleware = await isAuthenticated(request);

  if (authenticatedByMiddleware) {
    // Si un usuario autenticado intenta acceder a login o register, redirigir al dashboard
    if (pathname === '/login' || pathname === '/register') {
      console.log(`Middleware: Usuario AUTENTICADO (cookie) intentando acceder a '${pathname}'. Redirigiendo a /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Para otras rutas protegidas, permitir el acceso
    console.log(`Middleware: Usuario AUTENTICADO (cookie). Permitiendo acceso a la ruta protegida: '${pathname}'.`);
    return NextResponse.next();
  } else {
    // Usuario NO AUTENTICADO (cookie no encontrada) para una ruta protegida
    const loginUrl = new URL('/login', request.url);
    // Preserva la ruta original completa (incluyendo query params) como parámetro de redirección
    loginUrl.searchParams.set('redirect', fullRequestedPath);
    console.log(`Middleware: Usuario NO AUTENTICADO (cookie) para la ruta protegida '${fullRequestedPath}'. Redirigiendo a: ${loginUrl.toString()}`);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas, excepto a los internos de Next.js y archivos específicos
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
