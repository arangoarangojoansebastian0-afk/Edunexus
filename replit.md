# Comunidad Loyola - Student Community Platform

## Overview

Comunidad Loyola is a comprehensive student community platform for Colegio Loyola, designed to connect students, facilitate academic collaboration, and enable peer-to-peer tutoring. The platform combines social networking features (similar to Discord) with academic functionality (inspired by Google Classroom), creating a youthful and engaging environment for students to interact, share resources, and support each other's learning.

The application enables students to create and join groups (courses and clubs), share posts in a social feed, access a shared library of academic materials, and schedule tutoring sessions with peers. It includes role-based access (student, teacher, admin) with verification and moderation capabilities to maintain a safe educational environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2025-12-02)

### Complete Badge System Implementation
- **25+ comprehensive badges** covering all achievement categories:
  - **Académicas**: Intelectual, Explorador Científico, Literato, Historiador, Programador
  - **Deportivas**: Atleta, Campeón
  - **Artes**: Artista, Músico, Actor
  - **Liderazgo**: Líder, Mentor, Organizador
  - **Tecnología**: Experto Robótica, Innovador Tech
  - **Social**: Mariposa Social, Mano Amiga
  - **Especiales**: Débater, En Ascenso, Trabajo en Equipo, Guardián Ambiental, Excepcional
- **Database tables**: `badges` (25 definitions) + `user_badges` (user-badge assignments)
- **Badge assignment UI**: Teachers/admins can assign badges via dialog selector in user profiles
- **Badge display**: Tooltips show descriptions on hover in student profiles
- **Clickable authors**: Student names in posts/comments navigate to their profiles showing all assigned badges
- **Admin/Teacher access**: Teachers see badge management tab, admins see full admin panel

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
- Teachers can access badge assignment UI in profiles

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
- **Badges (NEW)**: badges table with 25+ definitions + userBadges assignment table
- Recognitions/Shoutouts with images
- Notifications and notification preferences

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
- ✅ Tutoring/advisory event scheduling with calendar
- ✅ User profile pages with clickable author names
- ✅ Admin moderation dashboard
- ✅ Report system
- ✅ Real-time messaging for groups
- ✅ **Badge System (NEW)**: 25+ comprehensive badges across all categories
- ✅ **Badge Assignment UI**: Teachers/admins can assign badges to students
- ✅ **Badge Tooltips**: Descriptions on hover in profiles
- ✅ **Recognitions/Shoutouts**: With image support and @mentions

### Next Priority Features
- 🔲 Direct messages between users (1:1 chat)
- 🔲 User blocking system
- 🔲 Favorites for posts/files
- 🔲 Global search (users, groups, posts)
- 🔲 @mentions with notifications in posts/comments

### Project Structure

```
/
├── client/src/
│   ├── pages/
│   │   ├── Login.tsx        # Login page with email/password
│   │   ├── Register.tsx     # Registration page
│   │   ├── Profile.tsx      # User profiles with badges display
│   │   ├── Admin.tsx        # Admin/Teacher dashboard
│   │   └── ... (other pages)
│   ├── components/
│   │   ├── UserMenu.tsx     # Updated for logout
│   │   ├── posts/
│   │   │   ├── PostCard.tsx      # Posts with clickable authors
│   │   │   └── CommentSection.tsx # Comments with clickable authors
│   │   └── admin/
│   │       └── BadgeManager.tsx   # Badge assignment UI
│   ├── context/
│   │   └── AuthContext.tsx  # Uses cookies, not OAuth
│   └── App.tsx              # Routes include /login, /register, /profile/:id
├── server/
│   ├── authSimple.ts        # Password hashing & verification
│   ├── authRoutes.ts        # Auth endpoints
│   ├── routes.ts            # Session middleware, requireAuth, badge routes
│   ├── storage.ts
│   ├── db.ts
│   ├── seed.ts              # 25 badge definitions + sample data
│   └── index.ts
├── shared/
│   └── schema.ts            # badges + userBadges tables
└── package.json
```

## Key Files Modified/Created

### New Files Created
- `server/authSimple.ts` - Password hashing utilities
- `server/authRoutes.ts` - Express routes for auth endpoints
- `client/src/pages/Login.tsx` - Login page
- `client/src/pages/Register.tsx` - Registration page
- `client/src/components/admin/BadgeManager.tsx` - Badge assignment component

### Modified Files
- `shared/schema.ts` - Added passwordHash to users table, added badges + userBadges tables
- `server/routes.ts` - Session middleware, updated requireAuth, added badge routes
- `client/src/context/AuthContext.tsx` - Uses /api/auth/user endpoint instead of OAuth
- `client/src/components/UserMenu.tsx` - Updated logout handler
- `client/src/components/posts/PostCard.tsx` - Clickable author names
- `client/src/components/posts/CommentSection.tsx` - Clickable author names
- `client/src/pages/Profile.tsx` - Display badges with tooltips, badge assignment UI
- `client/src/pages/Admin.tsx` - Teacher access to badges tab
- `client/src/App.tsx` - Added /login, /register, /profile/:id routes
- `server/seed.ts` - 25 comprehensive badge definitions

## Badge System Details

### 25 Badge Categories

**Académicas (5)**:
- Intelectual: Math achievement
- Explorador Científico: Science exploration
- Literato: Literature and writing
- Historiador: History knowledge
- Programador: Programming skills

**Deportivas (2)**:
- Atleta: Sports participation
- Campeón: Athletic achievements

**Artes (3)**:
- Artista: Visual arts
- Músico: Musical talent
- Actor: Performance arts

**Liderazgo (3)**:
- Líder: Leadership
- Mentor: Mentoring others
- Organizador: Event organization

**Tecnología (2)**:
- Experto Robótica: Robotics expertise
- Innovador Tech: Tech innovation

**Social (2)**:
- Mariposa Social: Socializing
- Mano Amiga: Helping others

**Especiales (5)**:
- Débater: Debate excellence
- En Ascenso: Growth potential
- Trabajo en Equipo: Collaboration
- Guardián Ambiental: Environmental awareness
- Excepcional: Overall excellence

## Testing the Badge System

### How to Test
1. **Register a new account** at `/register` with any email and password you choose
2. **Teacher Registration**: Use teacher code `1234` when registering as a teacher
3. **View Profiles**: Click on any student name in posts/comments
4. **Assign Badges**: Teachers/admins can click "Asignar Insignia" button to assign badges to students
5. **See Badges**: All 23 badges available in selector with descriptions
6. **Verify Database**: Check `badges` and `user_badges` tables in DB

### Demo Data in Database
- Pre-created users exist in database (Admin System, Profesor Garcia, Juan Pérez, María López, Carlos Rodríguez)
- Pre-created posts, groups, and other content for demonstration
- 23 comprehensive badges across all categories ready for assignment
- Note: Demo users have no passwords - register your own account to login

## Development Notes

- **Session Store**: MemoryStore for development (use PostgreSQL session store for production)
- **Password Requirements**: Minimum 6 characters
- **Email Validation**: Basic format validation
- **Session Duration**: 7 days
- **Cookies**: HTTP-only in production, secure flag set when NODE_ENV=production
- **Badge Display**: All 25 badges visible in profiles with tooltips
- **Badge Assignment**: Only teachers and admins can assign badges
- **Author Navigation**: Clicking on author names in posts/comments navigates to their profile

## No More Replit Auth

All references to Replit Auth, OAuth, OIDC, and external identity providers have been removed:
- ✅ No @replit/auth package
- ✅ No passport.js Replit strategy
- ✅ No OpenID Connect configuration
- ✅ No OAuth callback handling
- ✅ No token refresh logic
- ✅ Simple, self-contained authentication system
