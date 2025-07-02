import { type NextRequest, NextResponse } from 'next/server'
import { jwtVerify, type JWTPayload } from 'jose'
import { COOKIE } from '@/constants/cookies'

const JWT_SECRET = process.env.JWT_SECRET || ''

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/profile', '/farm/create', '/farm', '/dashboard']

// Public routes that authenticated users should be redirected away from
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

// Routes that should be accessible to everyone
const PUBLIC_ROUTES = ['/', '/about', '/contact', '/privacy', '/terms']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Get access token from cookies
    const accessToken = request.cookies.get(COOKIE.ACCESS)?.value || null
    // const accessToken = await getAccessTokenFromCookies()
    let user = null

    // Verify token if it exists
    if (accessToken) {
      const tokenPayload = await verifyAccessTokenEdge(accessToken)
      if (tokenPayload) {
        user = {
          id: tokenPayload.userId,
          phoneNumber: tokenPayload.phoneNumber,
          email: tokenPayload.email,
        }
      }
    }

    const { pathname } = request.nextUrl
    const isProtected = isProtectedRoute(pathname)
    const isAuthRoute = isAuthRoutes(pathname)

    // Redirect unauthenticated users from protected routes
    if (!user && isProtected) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from auth routes
    if (user && isAuthRoute) {
      // Check for redirect parameter
      const redirectUrl = request.nextUrl.searchParams.get('redirect')
      if (redirectUrl && !isAuthRoutes(redirectUrl)) {
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
      return NextResponse.redirect(new URL('/profile', request.url))
    }

    // Redirect unauthenticated users from root to login
    if (!user && pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If authenticated and on root, redirect to profile
    if (user && pathname === '/') {
      return NextResponse.redirect(new URL('/profile', request.url))
    }

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response
  } catch (error) {
    console.error('Middleware error:', error)

    // If there's an error and user is on a protected route, redirect to login
    if (isProtectedRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Otherwise, allow the request to continue
    return response
  }
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

function isAuthRoutes(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname)
}

function _isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname)
}

// Helper function to verify JWT in Edge Runtime using jose
async function verifyAccessTokenEdge(
  token: string,
): Promise<JWTPayload | null> {
  try {
    if (!JWT_SECRET) return null
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    if (payload.type !== 'access') return null
    return payload
  } catch (_error) {
    return null
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (image assets)
     * - icon.svg, apple-touch-icon.png, manifest.json (PWA files)
     * - api/ (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|icon.svg|apple-touch-icon.png|manifest.json|robots.txt|sitemap.xml|api/).*)',
  ],
}
