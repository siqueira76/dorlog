# Overview

FibroDiário is a Progressive Web App (PWA) designed for fibromyalgia patients to track pain, manage symptoms and medications, and coordinate with healthcare providers. It features detailed tracking of pain and crisis episodes, comprehensive CRUD operations for medical data, dynamic daily health quizzes, and automated generation of professional HTML reports for medical professionals. The project aims to empower patients in managing their health data and enhance communication with their healthcare teams.

**Business Vision & Market Potential**: FibroDiário addresses a critical need for chronic pain management tools, offering a user-friendly platform that integrates data tracking with professional reporting. Its PWA nature ensures broad accessibility.
**Project Ambitions**: To become a leading digital health companion for fibromyalgia patients, improving self-management and facilitating better patient-provider communication through data-driven insights, including advanced NLP analysis.

## Recent Changes (November 24, 2025)

### Recent Reports Feature on Home Page (Zero-Index Architecture) ✅ PRODUCTION-READY
- **Storage**: Reports stored as array in user document (`usuarios/[uid].recentReports`) - **NO separate Firestore collection needed**
- **Maximum 3 Reports**: Array maintains only last 3 generated reports using FIFO queue logic
- **Zero Firestore Queries**: `useRecentReports` hook reads directly from `AuthContext.currentUser.recentReports` using `useMemo`
- **No Index Required**: ✅ Eliminated Firestore composite index requirement entirely (critical blocker removed)
- **Type Safety**: `RecentReport` interface with `Date` objects, robust `Timestamp→Date` conversion in `unifiedReportService`
- **Smart Filtering**: Automatically filters expired reports client-side (7-day TTL on Storage URLs)
- **Loading States**: Hook respects `AuthContext.loading` state, shows skeleton during authentication
- **Empty States**: Clear UX when user has no reports or all reports expired
- **Home Page Section**: "Últimos Relatórios" displays up to 3 reports with period text, relative timestamps (`date-fns`), external link icons
- **Mobile-First Design**: Compact cards layout with truncation, touch-friendly targets
- **Code Cleanup**: Removed unused `AlertCircle` import, simplified component after removing error states
- **Documentation**: Removed `FIRESTORE_INDEXES_REQUIRED.md`, updated architecture docs
- **Removed "Atividade Recente"**: Cleaned up Home page by removing redundant recent activity section (~200 lines)

### Google Play Store Compliance - Affiliate Carousel Removal
- **Complete Removal**: Eliminated affiliate product carousel from Home page to ensure Google Play Store compliance
- **Policy Risk Mitigation**: Removed HIGH-CRITICAL risk of rejection due to spam/monetization disclosure violations
- **Clean UX**: Home page now directly shows Quick Actions (4 gradient cards: Registrar Crise, Tomar Remédio, Diário Manhã, Diário Noite)
- **Health App Standards**: Aligned with strict Google scrutiny for medical/health applications
- **No Functionality Loss**: Core fibromyalgia tracking features remain 100% intact
- **Code Cleanup**: Removed unused Carousel components, ExternalLink icon, auto-play states, and affiliate product data

### Freemium Report Generation Rules Enhancement
- **Free Tier Restrictions**: Users can only generate reports from **current month** (mês vigente)
- **Period Selection**: Disabled month selection dropdown for Free users (auto-selects current month)
- **Interval Mode**: Blocked for Free tier with upgrade modal prompt
- **Visual Indicators**: Added amber warning banner, Lock icons, and "Apenas mês atual" badge
- **Premium Features**: Premium/Trial users can select from last 12 months + interval mode
- **Documentation Updated**: FREEMIUM_SYSTEM.md and USAGE_SPEC.md reflect new rules

### Google Play Store CTAs Migration
- **All Premium CTAs Updated**: Header, DrawerNavigation, and Profile now link to Google Play Store (com.fibrodiario.app)
- **Consistent Freemium Messaging**: "Gratuito | Premium" badge pattern with Crown icon across all screens
- **Stripe References Removed**: Eliminated outdated Stripe checkout links
- **Pricing Updated**: R$ 19,90/month (from R$ 9,99) reflecting Google Play Billing model
- **Reports.tsx Unblocked**: "Gerar Relatório Mensal" button enabled for all users (Free tier can generate 1/month)

### In-App Medication Reminder System with Audio Alerts
- **Alert Sound System**: Implemented Web Audio API-based notification sounds (two-tone beep) that play when medication reminders trigger
- **Sound Utilities**: Created `notificationSound.ts` with `playNotificationSound()` and `playQuietBeep()` functions for audio alerts
- **User Preferences**: Added `NotificationSettings` page allowing users to enable/disable sounds (saved in localStorage)
- **Smart Audio**: Sound only plays if enabled in settings (default: enabled) and browser supports Web Audio API
- **ReminderNotifications Enhancement**: Integrated sound playback when new reminders appear, respecting user preferences

## Recent Changes (November 23, 2025)

### Google Login Onboarding Flow
- **GoogleLoginTermsDialog**: Combined terms acceptance and notification activation in single flow. Pre-checks notification opt-in for streamlined UX. Fail-safe design ensures terms are ALWAYS saved even if FCM fails, preventing onboarding blocks.
- **Robust FCM Error Handling**: `requestFCMToken` throws on VAPID key misconfiguration. Dialog catches errors, shows destructive toast, continues to save terms. Uses `notificationsSuccessfullyActivated` local variable to track REAL activation status (not async React state).
- **User Type Extensions**: Added `termsAccepted` and `termsAcceptedAt` fields with timestamp tracking.
- **GitHub Actions Workflow**: Updated `.github/workflows/deploy-frontend.yml` to include `VITE_FIREBASE_VAPID_KEY` in build environment (line 42).
- **Comprehensive Debug Logging**: Added `[FCM Service]` and `[Dialog]` prefixes throughout FCM flow for troubleshooting.

### Critical Configuration Requirements
- **VITE_FIREBASE_VAPID_KEY**: MUST be environment variable (not secret) for Vite to include in client bundle during build. Secrets are server-side only and cause "VAPID key not configured" errors.
- **Development Environment**: Set as shared environment variable in Replit (value: `BNaaU2CxdC4L8wIW7hbWTC68jRzm-P_D3SwEAuyiW3fxf6_zcYrkwuAf4HmtRdx0lka1wxwzxJbejMi4sod91XM`)
- **GitHub Secrets**: Add `VITE_FIREBASE_VAPID_KEY` to repository secrets for CI/CD builds.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The frontend uses React 18 with TypeScript, Vite for bundling, Wouter for routing, and TanStack Query for data management. Styling is handled with Tailwind CSS and shadcn/ui, adhering to a mobile-first, responsive, light-mode-only design with high-contrast, accessible colors. Navigation includes bottom tabs and a drawer-based side menu.

## Backend
The backend is an Express.js server in TypeScript, integrated with Drizzle ORM and Neon Database (PostgreSQL).

## Data Layer
Primary application data is stored in PostgreSQL, while Firestore is used for user profiles, authentication, quizzes, medical information, and daily reports. Firebase Authentication handles user logins (email/password, Google OAuth).
The `usuarios` Firestore collection stores user profiles with core fields, timezone information, FCM tokens, and granular notification preferences.

## UI/UX Decisions
The application features a light-mode-only interface with a high-contrast color scheme, bottom navigation tabs, drawer-based side navigation, and card-based layouts. It includes a dynamic quiz system and an enhanced EVA Scale component for pain assessment.

## Feature Specifications

### Quiz and Data Mapping System
FibroDiário includes a flexible daily questionnaire system with automatic semantic mapping of responses. It supports three quiz types (morning, evening, emergency) and classifies responses into categories like `eva_scale`, `pain_locations`, `symptoms`, etc. Data is persisted in the `report_diario` Firestore collection with robust validation.

### Report Generation & Sharing
Client-side generation of professional HTML reports from Firestore data. Reports are uploaded to Firebase Storage for public URLs and shared via a hybrid WhatsApp strategy (Web Share API, clipboard, fallback URI scheme).

### Isolated NLP Analysis System for Health Insights
This autonomous system provides advanced analysis of user-generated free text. It uses local AI models (`@xenova/transformers`) for privacy-first, browser-side execution. Models include DistilBERT-SST-2 for sentiment analysis, T5-Small for summarization, and DistilBERT-MNLI for zero-shot classification. Capabilities include sentiment analysis, summarization, entity extraction, urgency detection, temporal correlation, and predictive alerts. NLP insights are integrated into "Enhanced Reports" with sections for executive summaries, sentiment timelines, medical entity maps, and clinical recommendations.

### Monthly Reports with Integrated NLP Analysis
Two report types are generated: Standard (professional HTML with structured data) and Enhanced (incorporating full NLP analysis and AI-driven insights). Enhanced reports include an automated executive summary, temporal sentiment analysis, contextualized NLP insights, behavioral pattern detection, predictive alerts, and personalized clinical recommendations with advanced visualizations. Reports are optimized for client-side generation, standalone HTML, responsive, and privacy-focused with local NLP processing.

# External Dependencies

## Firebase Services
-   **Firebase Authentication**: User login and registration (email/password, Google OAuth).
-   **Firestore**: NoSQL database for user profiles, quizzes, medications, doctors, and daily reports.
-   **Firebase Storage**: For hosting generated HTML reports.
-   **Firebase Cloud Messaging (FCM)**: Push notification system for quiz reminders and health insights.
-   **Firebase Cloud Functions**: Server-side functions for scheduled notifications and NLP processing.

## Database & ORM
-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Drizzle ORM**: Type-safe ORM for PostgreSQL.

## UI & Design System
-   **shadcn/ui**: Reusable UI components.
-   **Radix UI**: Unstyled, accessible components.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Lucide React**: Icon library.

## Development Tools
-   **Vite**: Fast build tool.
-   **TanStack Query**: Data fetching, caching, and state management.
-   **Wouter**: Minimalist React router.
-   **React Hook Form**: Form management with validation.
-   **@xenova/transformers**: For local NLP processing in the browser.