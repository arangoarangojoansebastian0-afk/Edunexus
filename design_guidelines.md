# Design Guidelines: Comunidad Loyola

## Design Approach

**Hybrid Strategy:** Combining Material Design's structured accessibility with modern community platform aesthetics inspired by Discord (group/chat interfaces), Google Classroom (academic sections), and Linear (clean, focused layouts).

**Core Principle:** Create a youthful, engaging platform that balances social interaction with academic functionality. The design should feel welcoming and energetic while maintaining professional credibility for educational content.

---

## Typography System

### Font Families
- **Primary:** Inter (Google Fonts) - for UI elements, body text, navigation
- **Headings:** Poppins (Google Fonts) - for section titles, card headers, emphasis

### Type Scale
- **Display (h1):** 3xl - 4xl (48-60px) - Page titles, hero headlines
- **Heading 2:** 2xl - 3xl (30-36px) - Section headers
- **Heading 3:** xl - 2xl (24-30px) - Card titles, subsection headers
- **Body Large:** lg (18px) - Post content, important descriptions
- **Body:** base (16px) - Standard text, comments, forms
- **Small:** sm (14px) - Metadata, timestamps, secondary info
- **Caption:** xs (12px) - Labels, badges, helper text

### Weight Hierarchy
- **Bold (700):** Primary headings, CTAs
- **Semibold (600):** Subheadings, button text, active states
- **Medium (500):** Navigation items, card titles
- **Regular (400):** Body text, descriptions

---

## Layout System

### Spacing Primitives (Tailwind Units)
Core spacing set: **2, 3, 4, 6, 8, 12, 16, 20, 24**

- **Micro spacing (2-3):** Icon-to-text gaps, tight padding in badges
- **Component spacing (4-6):** Input padding, button padding, card internal spacing
- **Section spacing (8-12):** Between related elements, card gaps in grids
- **Major spacing (16-24):** Between distinct sections, page margins

### Grid System
- **Feed/Posts:** Single column (max-w-2xl centered) with full-width on mobile
- **Groups Dashboard:** 3-column grid (lg:grid-cols-3, md:grid-cols-2, base:grid-cols-1)
- **File Library:** 4-column grid for file cards (lg:grid-cols-4, md:grid-cols-3, sm:grid-cols-2)
- **Admin Panel:** 2-column layout (sidebar + main content area)

### Container Widths
- **Max container:** max-w-7xl (1280px)
- **Content sections:** max-w-4xl (896px)
- **Reading content:** max-w-2xl (672px)
- **Forms:** max-w-md (448px)

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with backdrop blur effect
- Logo left, primary nav center, profile/notifications right
- Search bar integrated (expandable on mobile)
- Height: h-16
- Padding: px-4 md:px-6

**Mobile Navigation:**
- Bottom tab bar for key sections (Feed, Groups, Library, Profile)
- Icons with labels, active state emphasized

### Cards & Containers

**Post Card:**
- Rounded corners (rounded-lg to rounded-xl)
- Subtle shadow (shadow-sm, hover:shadow-md)
- Padding: p-4 to p-6
- Author info header with avatar (48px circle), name, timestamp
- Content area with rich text support
- Footer with action buttons (like, comment, share)

**Group Card:**
- Horizontal layout on desktop, vertical on mobile
- Cover image area (aspect-ratio-16/9)
- Title overlay or adjacent text section
- Member count and recent activity indicators
- Padding: p-6

**File Card:**
- Vertical layout with file type icon (large, centered)
- File name (truncated with ellipsis)
- Metadata (subject, uploader, date)
- Download button
- Padding: p-4

### Forms & Inputs

**Text Inputs:**
- Border style with focus ring
- Height: h-12 for standard inputs
- Padding: px-4 py-3
- Rounded: rounded-lg
- Helper text below (text-sm)

**Buttons:**
- Primary: Solid background, rounded-lg, h-11, px-6
- Secondary: Bordered with transparent background
- Text only: No border, hover underline
- Icon buttons: Square (40x40px), rounded-full for profile actions

**Form Layouts:**
- Stacked inputs with spacing (space-y-4)
- Labels above inputs (text-sm, font-medium, mb-2)
- Two-column for related fields on desktop

### Chat Interface
- Messenger-style layout with conversation list (left, w-80) and active chat (right, flex-1)
- Message bubbles: rounded-2xl, max-w-md, padding p-3
- Sent messages aligned right, received aligned left
- Timestamps between message groups
- Sticky input area at bottom with h-16

### Calendar/Schedule
- Month view grid with equal-sized cells
- Event cards within cells (compact, truncated text)
- Day detail view showing timeline (hourly blocks)
- "Book Tutoring" button floating or prominently placed

### Moderation Panel
- Table layout for reports list
- Action buttons per row (Review, Delete, Dismiss)
- Filters above table (Status, Type, Date range)
- Modal for detailed review with content preview

---

## Page-Specific Layouts

### Landing Page (Public/Marketing)
**Hero Section:**
- Full-width container with 2-column layout (lg:grid-cols-2)
- Left: Headline (text-4xl to text-6xl), subheadline, CTA buttons (primary + secondary)
- Right: Hero image showing students collaborating or using the platform
- Height: min-h-screen or py-24

**Features Section:**
- 3-column grid showcasing Wall, Groups, Library features
- Icon (size-12), title (text-xl), description (text-base)
- Padding: py-20

**How It Works:**
- Alternating 2-column sections (image left/text right, then flip)
- Step numbers (large, decorative)

**Testimonials:**
- 2-column grid with student/teacher quotes
- Avatar, name, role, quote in card format

**CTA Footer:**
- Centered content, prominent "Join Comunidad Loyola" button
- Supporting text about verification process

### Feed/Wall Page
- Main content area (max-w-2xl, centered)
- "Create Post" composer at top (expandable textarea)
- Filter bar (Grade/Course dropdowns, horizontal scroll on mobile)
- Infinite scroll feed of post cards
- Right sidebar (hidden on mobile): Trending topics, suggested groups

### Groups Page
- Grid of group cards
- Tabs for "My Groups" vs "Discover"
- Search and filter controls

**Group Detail View:**
- Cover image (aspect-ratio-21/9, h-48)
- Group info header (name, description, member count, join/leave button)
- Tabs: Forum (posts), Chat (real-time), Files
- Forum: Standard post feed
- Chat: Dedicated chat interface component

### Library Page
- Search bar and filter sidebar (Subject, Type, Uploader)
- Grid of file cards
- Upload button (floating action button, bottom-right, rounded-full, size-14)

### Profile Page
- Cover photo area (h-48)
- Avatar overlapping cover (size-24, -mt-12)
- Bio section (name, grade, interests as pills)
- Badges display (grid of earned badges)
- Tabs: Posts, Files Shared, Activity

### Admin Dashboard
- Sidebar navigation (w-64, fixed)
- Main content area with stats cards at top (4 cards: Users, Posts, Reports, Files)
- Tables for user management and content moderation
- Action modals for verification and moderation decisions

---

## Interactions & Micro-animations

**Minimize Animations:** Use subtle, purposeful animations only:
- Hover state transitions (duration-200)
- Modal/dropdown appearances (fade-in, scale from 95% to 100%)
- Loading states (subtle spinner or skeleton screens)
- Toast notifications (slide-in from top-right)

**No Scroll Animations:** Avoid parallax or scroll-triggered effects to maintain performance and accessibility.

---

## Images

### Hero Image (Landing Page)
**Description:** Vibrant photo of diverse students collaborating in a modern classroom or campus setting, using laptops and engaging with each other. Warm, natural lighting. Shows sense of community and learning.

**Placement:** Right side of hero section on desktop (50% width), stacked below headline on mobile.

### Feature/Section Images
**Groups Feature:** Students in a study group or club meeting
**Library Feature:** Student browsing books or digital resources on tablet
**Tutoring Feature:** One-on-one tutoring session between students

These images should be authentic, high-quality photos that represent the Loyola student community.

---

## Accessibility Mandates

- Minimum touch target: 44x44px for all interactive elements
- Focus indicators visible on all focusable elements (ring-2 ring-offset-2)
- Semantic HTML throughout (nav, main, section, article, aside)
- ARIA labels for icon-only buttons
- Form inputs with associated labels (not placeholder-only)
- Sufficient contrast ratios maintained through design system choices
- Keyboard navigation fully supported (skip links, logical tab order)

---

## Responsive Behavior

### Breakpoints
- **Mobile:** Base (320px+)
- **Tablet:** md: 768px
- **Desktop:** lg: 1024px
- **Large Desktop:** xl: 1280px

### Key Adaptations
- Navigation: Top bar → Bottom tabs on mobile
- Grids: 3-4 columns → 2 columns → 1 column
- Sidebars: Visible → Collapsible drawer on mobile
- Typography: Larger headings scale down (4xl → 3xl → 2xl)
- Spacing: Generous padding (24) reduces to compact (16 or 12) on mobile

---

This design system creates a cohesive, accessible, and engaging platform that balances Loyola's academic mission with the social energy of student community life.