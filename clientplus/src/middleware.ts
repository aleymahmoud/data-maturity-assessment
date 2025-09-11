// src/middleware.ts - FIXED for Lead Consultant Access
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Allow access to login page
    if (pathname.startsWith('/login')) {
      return NextResponse.next();
    }

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Role-based access control for admin routes
    if (pathname.startsWith('/admin')) {
      const hasAdminAccess = ['SUPER_USER', 'LEAD_CONSULTANT'].includes(token.role as string);
      
      if (!hasAdminAccess) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // FIXED: Specific restrictions for LEAD_CONSULTANT
      if (token.role === 'LEAD_CONSULTANT') {
        // Lead consultants can only access these specific admin pages
        const allowedLeadPages = [
          '/admin',           // Dashboard
          '/admin/scopes'     // Scope Management
        ];

        // Check if current path is allowed for lead consultants
        const isAllowedPage = allowedLeadPages.some(allowedPath => {
          // Exact match for dashboard, startsWith for scopes (to handle /admin/scopes/anything)
          if (allowedPath === '/admin') {
            return pathname === '/admin';
          } else {
            return pathname.startsWith(allowedPath);
          }
        });

        if (!isAllowedPage) {
          // Redirect to admin dashboard if trying to access restricted page
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }

      // For SUPER_USER, all admin pages are allowed (no additional restrictions)
    }

    // Settings access control (existing)
    if (pathname.startsWith('/settings')) {
      if (!['SUPER_USER', 'LEAD_CONSULTANT'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow login page without token
        if (req.nextUrl.pathname.startsWith('/login')) {
          return true;
        }
        // Require token for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};