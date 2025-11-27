# Comunidad Loyola - Student Community Platform

## Overview

Comunidad Loyola is a comprehensive student community platform for Colegio Loyola, designed to connect students, facilitate academic collaboration, and enable peer-to-peer tutoring. The platform combines social networking features (similar to Discord) with academic functionality (inspired by Google Classroom), creating a youthful and engaging environment for students to interact, share resources, and support each other's learning.

The application enables students to create and join groups (courses and clubs), share posts in a social feed, access a shared library of academic materials, and schedule tutoring sessions with peers. It includes role-based access (student, teacher, admin) with verification and moderation capabilities to maintain a safe educational environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript, using Wouter for client-side routing instead of React Router.

**UI Component System**: Built on shadcn/ui (Radix UI primitives) with Tailwind CSS for styling. The design follows a hybrid approach combining Material Design principles with modern community platform aesthetics. Custom theme system supports light/dark modes with CSS variables for consistent theming.

**State Management**: TanStack Query (React Query) for server state management. No global state library used - relies on React Query's caching and React's built-in state management (useState, useContext) for local UI state.

**Form Handling**: React Hook Form with Zod validation schemas for type-safe form validation and submission.

**Design System**: 
- Typography: Inter (UI/body text) and Poppins (headings) from Google Fonts
- Custom spacing primitives aligned with Tailwind's spacing scale
- Responsive grid layouts for different content types (feed, groups, library)
- Component elevation system with hover/active states for depth perception

### Backend Architecture

**Runtime**: Node.js with Express.js server framework.

**API Pattern**: RESTful API design with conventional HTTP methods. Routes organized by resource type (posts, groups, files, events, etc.).

**Authentication**: Replit Auth (OpenID Connect) integration using Passport.js strategy. Session-based authentication with secure HTTP-only cookies. User verification workflow required before creating content.

**File Handling**: Multer middleware for file uploads with validation (max 10MB, specific file types). Files stored in local filesystem under `/uploads` directory.

**Authorization**: Role-based access control with three levels:
- Student: Base user, can create posts/comments, join groups, book tutoring
- Teacher: Enhanced permissions for academic content
- Admin: Full platform moderation and user management capabilities

**Database Access Layer**: Storage abstraction pattern with interface-based design (`IStorage`), allowing for future database swapping without business logic changes.

### Data Storage

**ORM**: Drizzle ORM with type-safe schema definitions and query builders.

**Database**: PostgreSQL via Neon serverless driver with WebSocket support for connection pooling.

**Session Store**: PostgreSQL-backed session storage using `connect-pg-simple`, storing session data in dedicated `sessions` table with automatic cleanup.

**Schema Design**:
- User profiles with role-based permissions, verification status, and interests
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
- **Replit Auth**: OAuth/OIDC authentication provider for user identity

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
- **express-session**: Session middleware with PostgreSQL persistence
- **memoizee**: OIDC configuration caching to reduce external calls

**File Processing**:
- **Multer**: Multipart form data handling for file uploads

**Security Considerations**:
- Content Security Policy through Vite configuration
- HTTPS-only cookies for session security
- Rate limiting ready (express-rate-limit in dependencies)
- Input validation via Zod schemas on both client and server
- Role-based route protection middleware (`requireAuth`, `requireVerified`)

**Development Environment**:
- Replit-specific plugins for development (runtime error overlay, cartographer, dev banner)
- Separate build processes for client (Vite) and server (ESBuild)
- Hot module replacement in development mode
- Production builds with optimized bundling and code splitting