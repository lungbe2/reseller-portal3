import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const locales = ['en', 'nl', 'af'] as const;
const defaultLocale = 'nl';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/og-image') || 
      pathname.startsWith('/robots') || 
      pathname.startsWith('/docs')) {
    return NextResponse.next();
  }

  // Handle locale routing
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale, redirect to default locale
  if (!pathnameHasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set('NEXT_LOCALE', defaultLocale, { path: '/', sameSite: 'lax' });
    return response;
  }

  // Extract locale and path
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.slice(locale.length + 1);

  // Allow access to public pages
  if (pathWithoutLocale === '' || 
      pathWithoutLocale === '/' || 
      pathWithoutLocale.startsWith('/login') || 
      pathWithoutLocale.startsWith('/forgot-password') ||
      pathWithoutLocale.startsWith('/register') ||
      pathWithoutLocale.startsWith('/signup')) {
    return NextResponse.next();
  }

  // Check authentication
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/signup|_next/static|_next/image|favicon.svg|og-image.png|robots.txt|docs).*)'],
};
