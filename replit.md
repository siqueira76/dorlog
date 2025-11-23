# Overview

FibroDiário is a Progressive Web App (PWA) designed for fibromyalgia patients to track pain, manage symptoms and medications, and coordinate with healthcare providers. It features detailed tracking of pain and crisis episodes, comprehensive CRUD operations for medical data, dynamic daily health quizzes, and automated generation of professional HTML reports for medical professionals. The project aims to empower patients in managing their health data and enhance communication with their healthcare teams.

**Business Vision & Market Potential**: FibroDiário addresses a critical need for chronic pain management tools, offering a user-friendly platform that integrates data tracking with professional reporting. Its PWA nature ensures broad accessibility.
**Project Ambitions**: To become a leading digital health companion for fibromyalgia patients, improving self-management and facilitating better patient-provider communication through data-driven insights, including advanced NLP analysis.

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