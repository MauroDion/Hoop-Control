import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Marcador de posición para la lógica relacionada con la autenticación
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // En una aplicación real, verificarías una cookie de sesión o un token.
  // Por ejemplo, usando Firebase Admin SDK para verificar un token de ID de una cookie.
  const sessionCookie = request.cookies.get('firebaseIdToken')?.value; // Ejemplo: buscar una cookie de sesión

  if (sessionCookie) {
    // Aquí, podrías añadir lógica de verificación si tu cookie contiene un token verificable.
    // Por ahora, la presencia de la cookie implica autenticación.
    console.log(`Middleware: isAuthenticated: Se encontró cookie de sesión para ${request.nextUrl.pathname}.`);
    return true;
  }
  console.log(`Middleware: isAuthenticated: No se encontró cookie de sesión para ${request.nextUrl.pathname}.`);
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`Middleware activado para la ruta: ${pathname}`);

  // Definir rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register', '/reset-password', '/'];

  // Si la ruta es una de las rutas públicas definidas, permitir el acceso directamente
  if (publicPaths.includes(pathname)) {
    console.log(`Middleware: Permitiendo ruta pública (coincidencia exacta): ${pathname}`);
    return NextResponse.next();
  }

  // Comprobar si el usuario está autenticado
  const authenticated = await isAuthenticated(request);
  console.log(`Middleware: Ruta ${pathname}, estado de autenticación: ${authenticated}`);

  // Si el usuario está autenticado:
  if (authenticated) {
    // Si un usuario autenticado intenta acceder a login o register, redirigir al dashboard
    if (pathname === '/login' || pathname === '/register') {
      console.log(`Middleware: Usuario autenticado en página de auth, redirigiendo a /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Para otras rutas, permitir el acceso
    console.log(`Middleware: Usuario autenticado, procediendo para la ruta: ${pathname}`);
    return NextResponse.next();
  }

  // Si el usuario NO está autenticado:
  if (!authenticated) {
    // Y está intentando acceder a una ruta protegida (es decir, no es una publicPath, que ya se comprobó)
    // Redirigir a login, preservando el destino previsto.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    console.log(`Middleware: No autenticado para ruta protegida, redirigiendo a ${loginUrl.toString()}`);
    return NextResponse.redirect(loginUrl);
  }

  // Fallback, idealmente debería estar cubierto por las condiciones anteriores
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas, excepto a los internos de Next.js y archivos específicos
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
