import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // If first login redirect to change password
    // BUT not if already on change-password or api routes
    if (
      token?.isFirstLogin === true &&
      pathname !== '/change-password' &&
      !pathname.startsWith('/api/auth/change-password') &&
      !pathname.startsWith('/api/')
    ) {
      return NextResponse.redirect(new URL('/change-password', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/employee-info/:path*',
    '/paystubs/:path*',
    '/contact/:path*',
    '/change-password/:path*',
    '/admin/:path*'
  ]
};