import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If Supabase is not configured yet, allow navigating to login with warning message
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('error', 'supabase_not_configured');
    return NextResponse.redirect(loginUrl);
  }

  // Inspect existing cookies for fast-path check
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.includes('-auth-token') || c.name.startsWith('sb-')
  );
  const adminVerifiedCookie = request.cookies.get('sg_admin_verified')?.value;

  // If no auth cookie exists, immediately deny access to protected /admin routes without remote queries
  if (!hasAuthCookie && pathname !== '/admin/login') {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.cookies.delete('sg_admin_verified');
    return redirectRes;
  }

  // FAST-PATH: If auth cookie exists and admin was already verified in this session, skip remote round-trips
  if (hasAuthCookie && adminVerifiedCookie === 'admin') {
    if (pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // Verify auth session with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If visiting /admin/login
  if (pathname === '/admin/login') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        const redirectRes = NextResponse.redirect(new URL('/admin', request.url));
        redirectRes.cookies.set('sg_admin_verified', 'admin', {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60, // 1 hour session
        });
        return redirectRes;
      }
    }
    return response;
  }

  // If visiting protected /admin route without logged-in user
  if (!user || authError) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.cookies.delete('sg_admin_verified');
    return redirectRes;
  }

  // Verify admin role from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('error', 'unauthorized');
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.cookies.delete('sg_admin_verified');
    return redirectRes;
  }

  // Set fast-path session cookie for snappy sub-page navigations
  response.cookies.set('sg_admin_verified', 'admin', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour session
  });

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
