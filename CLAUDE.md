# Farm Management Full Stack - Project Context

## Project Overview
JAOTHUI Farm Management E-ID System - A comprehensive farm management platform built for Thai farmers to digitally manage animal data, schedule activities, and receive real-time notifications. The system replaces traditional paper-based animal records with a modern, mobile-first web application.

**Target Users**: Thai farmers (primary: 45-55 years old farm owners, secondary: 25-35 years old farm workers)

## Tech Stack
- **Framework**: Next.js 15.3.4 with App Router
- **Database**: Supabase PostgreSQL with Prisma ORM
- **UI**: DaisyUI + TailwindCSS with custom "jaothui" theme (#D4AF37)
- **Authentication**: Supabase Auth (phone + password)
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Query (@tanstack/react-query)
- **Animations**: Framer Motion
- **Storage**: Supabase Storage (for image uploads)
- **Notifications**: Sonner + Supabase real-time subscriptions
- **TypeScript**: Strict mode enabled
- **Typography**: Inter + Sarabun (Thai language support)

## Development Commands
```bash
# Development server
npm run dev

# Build and type checking
npm run build
npm run lint
npm run typecheck

# Database operations
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   └── (dashboard)/       # Dashboard pages
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
├── types/                 # TypeScript type definitions
└── constants/             # Application constants
```

## Key Features Implemented
- ✅ Project setup with Next.js 15.3.4 and all dependencies
- ✅ Custom "jaothui" theme with DaisyUI (golden #D4AF37)
- ✅ Authentication system with Supabase Auth
- ✅ Farm management (create, join, manage members)
- ✅ Basic animal management (CRUD operations)
- ✅ Database schema with Prisma + Supabase
- ✅ Responsive UI with mobile optimization

## Core Business Logic
- **Farm Ownership**: Each user can own 1 farm and be a member of 1 farm
- **Animal Types**: Supports 10 animal types (หมู, ไก่, โค, วัว, ควาย, ไก่ชน, เป็ด, ห่าน, ไก่เนื้อ, ไก่ไข่)
- **Microchip System**: Auto-generated format TH{farmId}{timestamp}{random}
- **Activity Types**: 
  - Activity: Completed tasks (logged after doing)
  - ActivitySchedule: Future reminders (scheduled in advance)
- **Thai Calendar**: Buddhist calendar (พ.ศ.) support in UI
- **Phone Authentication**: Uses Thai phone format (0929931147)

## Current Task Status (from .taskmaster)
### Critical Path - Task 9: Animal Management Enhancement
**Status**: Pending (7 subtasks)
- Image upload functionality for animal photos
- Enhanced animal API endpoints with full details
- Animal detail pages with complete information
- Animal activity history tracking
- CSV export functionality
- Role-based access control
- Integration testing and mobile optimization

### Next Tasks (Sequential Dependencies)
1. **Task 10**: Activity and Schedule Management System (6 subtasks)
2. **Task 11**: Real-time Notification System (6 subtasks)  
3. **Task 12**: Performance Optimization and Production Polish

## Database Schema Notes
- Animals table includes: name, species, breed, birthDate, gender, fatherName, motherName, notes, photoUrl
- Farm membership system with roles (owner, member)
- Activity tracking system for animal care tasks

## Development Guidelines
- Follow existing code patterns and conventions
- Use TypeScript strict mode - no any types
- Implement proper error handling with React Error Boundaries
- Use React Hook Form + Zod for all form validation
- Implement proper loading states and error states
- Follow mobile-first responsive design (primary: mobile users)
- Use DaisyUI components with custom jaothui theme
- Support Thai language (Buddhist calendar, Thai phone format)
- Use Supabase Auth (not NextAuth) with phone authentication
- Implement Row Level Security (RLS) for data protection
- Use Server Actions instead of API routes
- Follow jaothui brand guidelines (golden theme, Inter+Sarabun fonts)

## Testing Strategy
- Verify all CRUD operations work correctly
- Test image upload/display functionality with Supabase Storage
- Ensure mobile responsiveness (90% mobile usage)
- Test Thai language support and Buddhist calendar
- Test phone authentication flow
- Verify RLS policies work correctly
- Test farm ownership/membership restrictions
- Verify accessibility compliance for older users

## UI/UX References
All UI layouts are documented in `.taskmaster/docs/ui_*.json`:
- `ui_home_layout.json` - Welcome page design
- `ui_login_layout.json` - Phone authentication
- `ui_dashboard_layout.json` - Main dashboard with animal tabs
- `ui_animal_detail_layout.json` - Animal profile pages
- `ui_animal_create_layout.json` - Animal registration form
- Use these as exact specifications for UI implementation

## Priority Focus
1. **HIGH**: Complete Animal Management with Images (Task 9)
2. **MEDIUM**: Activity System and Notifications (Tasks 10-11)
3. **LOW**: Performance optimization and production polish (Task 12)

## Important Context
- Target users: Thai farmers (45-55 years) who prefer simple, visual interfaces
- Mobile-first: 90% usage via smartphones
- Thai language primary, Buddhist calendar (พ.ศ.) 
- Phone authentication (format: 0929931147)
- Visual confirmation important (photos increase trust)
- Simple, single-purpose design preferred
- One farm ownership + one farm membership rule
- Auto-generated microchips: TH{farmId}{timestamp}{random}