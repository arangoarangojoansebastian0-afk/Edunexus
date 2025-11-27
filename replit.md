# Comunidad Loyola - Student Community Platform

## Overview

Comunidad Loyola is a comprehensive student community platform for Colegio Loyola, designed to connect students, facilitate academic collaboration, and enable peer-to-peer tutoring. The platform combines social networking features (similar to Discord) with academic functionality (inspired by Google Classroom), creating a youthful and engaging environment for students to interact, share resources, and support each other's learning.

The application enables students to create and join groups (courses and clubs), share posts in a social feed, access a shared library of academic materials, and schedule tutoring sessions with peers. It includes role-based access (student, teacher, admin) with verification and moderation capabilities to maintain a safe educational environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2025-11-27)

### Complete Authentication System Overhaul
- **Removed Replit Auth completely**: Deleted replitAuth.ts and all OAuth/OIDC integration
- **Implemented simple email/password authentication**:
  - New auth routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
  - Password hashing with bcryptjs (10 salt rounds)
  - Session-based authentication using express-session with in-memory store
  - HTTP-only cookies for session management (7-day expiration)
- **Updated database schema**:
  - Added `passwordHash` field to users table
- **Created new authentication pages**:
  - `/login` - Email/password login form
  - `/register` - User registration with name, email, password
- **Simplified authorization**:
  - Replaced passport/OAuth middleware with simple session verification
  - New session loading middleware that attaches user to request object
  - Updated requireAuth to check req.session.userId instead of req.isAuthenticated()
- **Frontend updates**:
  - AuthContext updated to use cookies instead of OAuth tokens
  - UserMenu now shows logout option with session cleanup
  - useLocation hook from wouter for navigation (not useNavigate)

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript, using Wouter for client-side routing.

**UI Component System**: Built on shadcn/ui (Radix UI primitives) with Tailwind CSS for styling.

**State Management**: TanStack Query for server state, React Context for auth state.

**Form Handling**: React Hook Form with Zod validation.

**Authentication**: Cookie-based sessions with localStorage fallback for UX.

**Design System**: 
- Typography: Inter (UI) and Poppins (headings)
- Responsive layouts with elevation system for depth
- Light/dark mode support

### Backend Architecture

**Runtime**: Node.js with Express.js.

**API Pattern**: RESTful with conventional HTTP methods.

**Authentication**: Simple email/password with bcryptjs hashing.
- Registration: Email validation, password hashing, user creation
- Login: Email/password verification against hash
- Session: HTTP-only cookies with 7-day expiration
- Middleware: Session loading attaches user to request object

**Authorization**: Role-based (student, teacher, admin) with middleware:
- `requireAuth`: Checks session exists and user is logged in
- `requireVerified`: Ensures user email is verified
- `requireAdmin`: Ensures user has admin role

**Password Security**: 
- Bcryptjs with 10 salt rounds for hashing
- Password never stored in plaintext
- Hash comparison during login verification

**File Handling**: Multer middleware with 10MB limit and file type validation.

**Database Access Layer**: Storage abstraction with IStorage interface.

### Data Storage

**ORM**: Drizzle ORM with PostgreSQL.

**Database**: Neon serverless PostgreSQL.

**Session Store**: In-memory MemoryStore (suitable for development).

**Schema Design**:
- User profiles with password hash, roles, verification status
- Groups (courses/clubs) with member tracking
- Posts with comments and reactions
- Files with visibility controls
- Events (tutoring) with participants
- Reports for moderation
- Messages for group chat
- Badges for achievements

### External Dependencies

**Core**:
- Neon Database: PostgreSQL hosting
- bcryptjs: Password hashing

**Frontend**:
- Radix UI: Accessible components
- TanStack Query: Server state management
- date-fns: Date utilities
- Wouter: Lightweight routing

**Backend**:
- Express.js: Server framework
- express-session: Session middleware
- MemoryStore: In-memory session storage
- Multer: File upload handling

**Security**:
- HTTP-only cookies (XSS protection)
- Password hashing with bcryptjs
- Input validation with Zod
- Role-based access control middleware

## Authentication Flow

### Registration
1. User navigates to `/register`
2. Enters: name, email, password
3. Backend validates email format and password length
4. Password is hashed with bcryptjs
5. User created in database
6. Session is automatically created and stored in HTTP-only cookie
7. User is logged in automatically

### Login
1. User navigates to `/login`
2. Enters email and password
3. Backend retrieves user by email
4. Compares provided password against stored hash
5. If valid, session is created and stored in HTTP-only cookie
6. User is logged in

### Session Management
1. All authenticated requests verify `req.session.userId` exists
2. Session middleware loads user from database on each request
3. User is attached to `req.user` for downstream middleware/routes
4. Cookies expire after 7 days of inactivity
5. On logout, session is destroyed and cookie is cleared

### Frontend Session Persistence
1. AuthContext loads user from localStorage on app start
2. Verifies session with `/api/auth/user` endpoint
3. If session is invalid, clears localStorage
4. On page focus, re-verifies session to catch logout from other tabs

## Current Implementation Status

### Completed Features
- ✅ User authentication (register/login/logout)
- ✅ Session-based auth with cookies
- ✅ Password hashing with bcryptjs
- ✅ User profiles with roles (student/teacher/admin)
- ✅ Public wall with posts and comments
- ✅ Post reactions (likes)
- ✅ Groups (courses and clubs)
- ✅ Group memberships
- ✅ Academic file library
- ✅ Tutoring/advisory event scheduling
- ✅ User profile pages
- ✅ Admin moderation dashboard
- ✅ Report system
- ✅ Real-time messaging for groups

### Project Structure

```
/
├── client/src/
│   ├── pages/
│   │   ├── Login.tsx        # Login page with email/password
│   │   ├── Register.tsx     # Registration page
│   │   ├── Landing.tsx
│   │   └── ... (other pages)
│   ├── components/
│   │   └── UserMenu.tsx     # Updated for logout
│   ├── context/
│   │   └── AuthContext.tsx  # Uses cookies, not OAuth
│   └── App.tsx              # Routes include /login, /register
├── server/
│   ├── authSimple.ts        # Password hashing & verification
│   ├── authRoutes.ts        # Auth endpoints
│   ├── routes.ts            # Session middleware, requireAuth
│   ├── storage.ts
│   ├── db.ts
│   └── index.ts
├── shared/
│   └── schema.ts            # passwordHash field in users table
└── package.json
```

## Key Files Modified/Created

### Files Deleted
- `server/replitAuth.ts` - Completely removed Replit Auth/OAuth implementation

### New Files
- `server/authSimple.ts` - Password hashing utilities
- `server/authRoutes.ts` - Express routes for auth endpoints
- `client/src/pages/Login.tsx` - Login page
- `client/src/pages/Register.tsx` - Registration page

### Modified Files
- `shared/schema.ts` - Added passwordHash to users table
- `server/routes.ts` - Removed setupAuth/isAuthenticated, added session middleware, updated requireAuth
- `client/src/context/AuthContext.tsx` - Uses /api/auth/user endpoint instead of OAuth
- `client/src/components/UserMenu.tsx` - Updated logout handler
- `client/src/App.tsx` - Added /login and /register routes
- `client/src/pages/Landing.tsx` - Updated login button to navigate to /login

## Testing Authentication

1. **Start the app**: `npm run dev`
2. **Register**: Navigate to `/register` and create account
3. **Login**: Navigate to `/login` with credentials
4. **Session persistence**: Refresh page - user stays logged in
5. **Logout**: Click avatar → "Cerrar Sesión"
6. **Protected routes**: Unauthenticated users redirected to `/login`

## Development Notes

- **Session Store**: MemoryStore for development (use PostgreSQL session store for production)
- **Password Requirements**: Minimum 6 characters
- **Email Validation**: Basic format validation (before was domain-specific, now accepts any email)
- **Session Duration**: 7 days
- **Cookies**: HTTP-only in production, secure flag set when NODE_ENV=production
- **No OAuth/OIDC**: Completely eliminated external authentication provider dependency

## No More Replit Auth

All references to Replit Auth, OAuth, OIDC, and external identity providers have been removed:
- ✅ No @replit/auth package
- ✅ No passport.js Replit strategy
- ✅ No OpenID Connect configuration
- ✅ No OAuth callback handling
- ✅ No token refresh logic
- ✅ Simple, self-contained authentication system
