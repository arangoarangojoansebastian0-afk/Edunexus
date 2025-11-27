# Comunidad Loyola - Student Community Platform

## Overview

Comunidad Loyola is a comprehensive student community platform for Colegio Loyola, designed to connect students, facilitate academic collaboration, and enable peer-to-peer tutoring. The platform combines social networking features (similar to Discord) with academic functionality (inspired by Google Classroom), creating a youthful and engaging environment for students to interact, share resources, and support each other's learning.

The application enables students to create and join groups (courses and clubs), share posts in a social feed, access a shared library of academic materials, and schedule tutoring sessions with peers. It includes role-based access (student, teacher, admin) with verification and moderation capabilities to maintain a safe educational environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2025-11-27)

### Authentication System Replacement
- Replaced Replit Auth (OAuth/OIDC) with simple email/password authentication
- Implemented bcryptjs for secure password hashing
- Created new authentication routes:
  - `POST /api/auth/register` - User registration with email, password, name
  - `POST /api/auth/login` - Email/password login with session creation
  - `POST /api/auth/logout` - Session termination
  - `GET /api/auth/user` - Current user info from session
- Updated schema: Added `passwordHash` field to users table
- Session management using express-session with in-memory store (MemoryStore)
- Sessions stored as HTTP-only cookies with 7-day expiration
- Created new pages:
  - `/login` - Login form with email/password inputs
  - `/register` - Registration form with name, email, password
- Updated AuthContext to use cookies instead of OAuth state
- Updated UserMenu to show logout option with session cleanup

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript, using Wouter for client-side routing instead of React Router.

**UI Component System**: Built on shadcn/ui (Radix UI primitives) with Tailwind CSS for styling. The design follows a hybrid approach combining Material Design principles with modern community platform aesthetics. Custom theme system supports light/dark modes with CSS variables for consistent theming.

**State Management**: TanStack Query (React Query) for server state management. No global state library used - relies on React Query's caching and React's built-in state management (useState, useContext) for local UI state.

**Form Handling**: React Hook Form with Zod validation schemas for type-safe form validation and submission.

**Authentication**: Cookie-based session authentication with localStorage persistence for smoother UX. AuthContext manages user state with automatic refetch on page focus.

**Design System**: 
- Typography: Inter (UI/body text) and Poppins (headings) from Google Fonts
- Custom spacing primitives aligned with Tailwind's spacing scale
- Responsive grid layouts for different content types (feed, groups, library)
- Component elevation system with hover/active states for depth perception

### Backend Architecture

**Runtime**: Node.js with Express.js server framework.

**API Pattern**: RESTful API design with conventional HTTP methods. Routes organized by resource type (posts, groups, files, events, etc.).

**Authentication**: Simple email/password authentication with bcryptjs password hashing. Session-based authentication using express-session with HTTP-only cookies. No OAuth complexity - straightforward registration and login flow.

**Password Security**: 
- Passwords hashed with bcryptjs (10 salt rounds)
- Password never stored in plaintext
- Verify password against hash during login

**File Handling**: Multer middleware for file uploads with validation (max 10MB, specific file types). Files stored in local filesystem under `/uploads` directory.

**Authorization**: Role-based access control with three levels:
- Student: Base user, can create posts/comments, join groups, book tutoring
- Teacher: Enhanced permissions for academic content
- Admin: Full platform moderation and user management capabilities

**Database Access Layer**: Storage abstraction pattern with interface-based design (`IStorage`), allowing for future database swapping without business logic changes.

### Data Storage

**ORM**: Drizzle ORM with type-safe schema definitions and query builders.

**Database**: PostgreSQL via Neon serverless driver with WebSocket support for connection pooling.

**Session Store**: In-memory session storage using MemoryStore with automatic expiration cleanup.

**Schema Design**:
- User profiles with role-based permissions, verification status, interests, and password hash
- Groups with type distinction (course/club) and member tracking
- Posts with author relationships and metadata (pinned, grade-level targeting)
- Comments with nested thread support
- Files with visibility controls (public/group/private) and subject categorization
- Events (tutoring sessions) with participant limits and calendar integration
- Reports with status workflow for content moderation
- Messages for group-based real-time chat
- Badges and achievements system for gamification

### External Dependencies

**Core Infrastructure**:
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **bcryptjs**: Secure password hashing and verification

**Frontend Libraries**:
- **Radix UI**: Unstyled, accessible component primitives (20+ components)
- **TanStack Query**: Server state synchronization and caching
- **date-fns**: Date manipulation and formatting with Spanish locale support
- **Wouter**: Lightweight routing library

**Development Tools**:
- **Vite**: Build tool and development server with HMR
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production server bundling with selective dependency bundling
- **TypeScript**: Type safety across client and server with path aliases

**Session Management**:
- **express-session**: Session middleware with in-memory persistence
- **MemoryStore**: In-memory session store for development

**File Processing**:
- **Multer**: Multipart form data handling for file uploads

**Security Considerations**:
- Content Security Policy through Vite configuration
- HTTPS-only cookies for session security (in production)
- HTTP-only cookies to prevent XSS access
- Password hashing with bcryptjs (10 salt rounds)
- Rate limiting ready (express-rate-limit in dependencies)
- Input validation via Zod schemas on both client and server
- Role-based route protection middleware (`requireAuth`, `requireVerified`)

**Development Environment**:
- Replit-specific plugins for development (runtime error overlay, cartographer, dev banner)
- Separate build processes for client (Vite) and server (ESBuild)
- Hot module replacement in development mode
- Production builds with optimized bundling and code splitting

## Current Implementation Status

### Completed Features
- ✅ User authentication (register/login/logout)
- ✅ Session-based authentication with cookies
- ✅ User profiles with roles (student/teacher/admin)
- ✅ Public wall with posts and comments
- ✅ Post reactions (likes)
- ✅ Groups (courses and clubs)
- ✅ Group memberships
- ✅ Academic file library
- ✅ Tutoring/advisory event scheduling
- ✅ User profile pages
- ✅ Admin moderation dashboard
- ✅ Report system for content moderation
- ✅ Real-time messaging for groups

### Project Structure

```
/
├── client/src/
│   ├── pages/              # Page components
│   │   ├── Login.tsx        # NEW: Login page
│   │   ├── Register.tsx     # NEW: Registration page
│   │   ├── Landing.tsx
│   │   ├── Home.tsx
│   │   ├── Groups.tsx
│   │   ├── GroupDetail.tsx
│   │   ├── Library.tsx
│   │   ├── Tutoring.tsx
│   │   ├── Profile.tsx
│   │   ├── Admin.tsx
│   │   ├── Notifications.tsx
│   │   └── Settings.tsx
│   ├── components/          # Reusable components
│   ├── context/
│   │   └── AuthContext.tsx  # UPDATED: Uses cookies instead of OAuth
│   ├── lib/
│   ├── hooks/
│   └── App.tsx             # UPDATED: Added /login and /register routes
├── server/
│   ├── authSimple.ts       # NEW: Password hashing and verification
│   ├── authRoutes.ts       # NEW: Auth endpoints (register, login, logout)
│   ├── routes.ts           # UPDATED: Session middleware and /api/auth/user
│   ├── storage.ts
│   ├── db.ts
│   └── index.ts
├── shared/
│   └── schema.ts           # UPDATED: Added passwordHash field to users
└── package.json
```

## Key Files Modified/Created

### New Files
- `server/authSimple.ts` - Password hashing utilities (hashPassword, verifyPassword, registerUser, loginUser)
- `server/authRoutes.ts` - Express routes for authentication endpoints
- `client/src/pages/Login.tsx` - Login page with email/password form
- `client/src/pages/Register.tsx` - Registration page with name, email, password fields

### Modified Files
- `shared/schema.ts` - Added `passwordHash: varchar("password_hash")` to users table
- `client/src/context/AuthContext.tsx` - Updated to use `/api/auth/user` endpoint instead of OAuth
- `client/src/components/UserMenu.tsx` - Updated logout to call `/api/auth/logout`
- `client/src/App.tsx` - Added `/login` and `/register` routes
- `client/src/pages/Landing.tsx` - Updated login button to navigate to `/login`
- `server/routes.ts` - Added express-session middleware and `/api/auth/user` endpoint

## Testing Instructions

1. **Start the app**: `npm run dev` (already configured)
2. **Register a new account**: 
   - Navigate to `/register`
   - Fill in: name, email, password
   - Password must be at least 6 characters
3. **Login**:
   - Navigate to `/login`
   - Enter email and password
   - Session is stored in cookies
4. **Logout**:
   - Click user avatar/menu in header
   - Click "Cerrar Sesión" (Logout)
5. **Session persistence**:
   - Login and refresh the page
   - User should still be logged in (from localStorage and cookie)

## Development Notes

- Authentication uses express-session with in-memory store (suitable for development)
- For production, consider using a persistent session store (PostgreSQL, Redis)
- Passwords are hashed with bcryptjs before storage
- Sessions expire after 7 days
- Cookies are HTTP-only and secure (in production)
- Email validation is built into Zod schema
- Password minimum length is 6 characters
