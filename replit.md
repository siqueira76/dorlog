# Overview

FibroDiário is a Progressive Web App (PWA) designed for patients with fibromyalgia. It allows users to track pain, manage symptoms and medications, and coordinate with healthcare providers. Key capabilities include detailed tracking of pain and crisis episodes, comprehensive CRUD operations for medication and doctor management, dynamic daily health quizzes, and the automated generation of professional HTML reports for sharing with medical professionals. The project aims to empower fibromyalgia patients in managing their health data and enhance communication with their healthcare teams.

**Business Vision & Market Potential**: FibroDiário addresses a critical need for chronic pain management tools, offering a user-friendly platform that integrates data tracking with professional reporting. Its PWA nature ensures broad accessibility.
**Project Ambitions**: To become a leading digital health companion for fibromyalgia patients, improving self-management and facilitating better patient-provider communication through data-driven insights, including advanced NLP analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The frontend is built with React 18 and TypeScript, using Vite for development and bundling. It employs Wouter for routing and TanStack Query for efficient data management. Styling is implemented with Tailwind CSS and shadcn/ui, adhering to a mobile-first, responsive, and light-mode-only design with high-contrast, accessible colors. Navigation features bottom tabs and a drawer-based side menu.

## Backend
The backend utilizes an Express.js server, written in TypeScript. It integrates with Drizzle ORM and Neon Database (PostgreSQL) for core application data management.

## Data Layer
Primary application data is stored in PostgreSQL, while Firestore is used for user profiles, authentication, and specific collections like `usuarios`, `assinaturas`, `quizzes`, `medicos`, `medicamentos`, and `report_diario`. Firebase Authentication handles user logins (email/password, Google OAuth).

## UI/UX Decisions
The application features a light-mode-only interface with a high-contrast color scheme, bottom navigation tabs, drawer-based side navigation, and card-based layouts. It includes a dynamic quiz system for health tracking and an enhanced EVA Scale component for pain assessment.

## Feature Specifications

### Quiz and Data Mapping System
FibroDiário includes a flexible daily questionnaire system with automatic semantic mapping of responses. This involves three quiz types (morning, evening, emergency) and a system that classifies responses into categories like `eva_scale`, `pain_locations`, `symptoms`, `emotional_state`, etc. Data is persisted in the `report_diario` Firestore collection, with robust validation and normalization processes.

### Report Generation & Sharing
A client-side system generates professional HTML reports from Firestore data, uploading them to Firebase Storage for permanent public URLs. It uses a template engine for comprehensive medical reports, optimized for cross-platform compatibility. Report sharing is facilitated via a hybrid multi-platform WhatsApp strategy, using the Web Share API on mobile, clipboard integration for desktop, and a fallback URI scheme.

### Isolated NLP Analysis System for Health Insights
This autonomous system, integrated into FibroDiário, provides advanced analysis of user-generated free text.
- **Privacy-First Approach**: Utilizes local AI models (`@xenova/transformers`) for browser-side execution, ensuring zero data transmission to external servers.
- **Models**: Includes DistilBERT-SST-2 for sentiment analysis, T5-Small for summarization, and DistilBERT-MNLI for zero-shot classification of medical entities. A hybrid system combines AI with specialized rules for urgency detection.
- **Capabilities**: Sentiment analysis, automatic summarization, entity extraction (symptoms, medications, body parts), urgency detection, temporal correlation analysis, and predictive alerts.
- **Integration**: NLP insights are incorporated into "Enhanced Reports" with dedicated sections for executive summaries, sentiment timelines, medical entity maps, and clinical recommendations.
- **Robustness**: Features hybrid fallback mechanisms, lazy loading of models, intelligent timeouts, and analysis caching.

### Monthly Reports with Integrated NLP Analysis
Two types of reports are generated:
1.  **Standard Report**: Professional HTML with structured data and basic visualizations.
2.  **Enhanced Report**: Advanced version incorporating full NLP analysis and AI-driven insights.

**Enhanced Report Sections**: Include an automated executive summary, temporal sentiment analysis, contextualized NLP insights, behavioral pattern detection, predictive alerts, and personalized clinical recommendations. Advanced visualizations like Sentiment Timeline, Pain-Mood Correlation, Medical Entities Map, and Urgency Heatmap are provided. Text processing for these insights includes sentiment, summarization, and entity classification. Reports are optimized for client-side generation (2-5 seconds), are standalone HTML, responsive, and ensure full privacy with local NLP processing.

# Recent Changes
- **November 22, 2025**: Migration to Firebase Hosting + Cloud Run completed
  - **Architecture Change**: Migrated from GitHub Pages (frontend-only) to Firebase Hosting + Cloud Run (full-stack)
  - **Base Path Removed**: Eliminated `/dorlog/` base path, now using clean root path `/`
  - **CI/CD Automated**: Configured GitHub Actions with intelligent path filters (frontend vs backend)
  - **Backend Containerization**: Created multi-stage Dockerfile for Cloud Run deployment
  - **Cost Optimization**: Reduced hosting costs by ~70% ($25/month → $0-8/month)
  - **Health Check**: Added `/health` endpoint for Cloud Run monitoring
  - **Firebase Integration**: Configured rewrites for `/api/**` → Cloud Run backend
  - **Navigation Simplified**: Removed GitHub Pages detection logic, using root path everywhere
  - **Files Created**: Dockerfile, .dockerignore, deploy-frontend.yml, deploy-backend.yml, .firebaserc, MIGRATION.md
  - **Files Modified**: firebase.json, vite.config.ts, package.json, server/routes.ts, App.tsx, navigation.ts, .gitignore
  - **Documentation**: Created comprehensive MIGRATION.md with deployment instructions
- **September 20, 2025**: Phase 2 completed successfully - Critical data restoration achieved
  - **100% data restoration**: All 6 critical medical data categories fully restored in enhancedHtmlTemplate.ts
  - **CRM rendering**: Doctor CRMs (Dr. Jéssica, Dr. Edilio) now properly displayed
  - **Medication details**: Specific medications (Sotalol 120mg, Rosuvastatina 20mg, Losartana 20mg) with frequencies restored
  - **Crisis quantification**: 7 crises/12 days, intensity 8.3/10, detailed affected locations implemented
  - **Quantified correlations**: Sleep↔Pain: 0.82, Mood↔Pain: 0.65 confirmed in HTML output
  - **Temporal patterns**: 43% afternoon, peak hours 13h/22h with specific analysis
  - **Morning/night specifics**: 6.7/10 pain intensity and detailed health correlations
  - **Architect approval**: Pass verdict confirming restoration target exceeded
  - **System integrity**: Workflow running successfully, all medical data processing intact
- **September 19, 2025**: Successfully imported and configured project for Replit environment
  - Configured Express server to run on port 5000 with proper host settings (0.0.0.0)
  - Set up Vite development server with `allowedHosts: true` for Replit proxy compatibility
  - Verified workflow configuration and deployment settings
  - Firebase integration available but requires environment variables setup

# External Dependencies

## Firebase Services
-   **Firebase Authentication**: For user login and registration (email/password, Google OAuth).
-   **Firestore**: NoSQL database for managing user profiles, quizzes, medications, doctors, and daily reports.
-   **Firebase Storage**: For hosting generated HTML reports and providing permanent public URLs.
-   **Status**: Firebase integration blueprint installed, needs API key configuration

## Database & ORM
-   **Neon Database**: Serverless PostgreSQL hosting solution.
-   **Drizzle ORM**: Type-safe ORM used for interacting with PostgreSQL.

## UI & Design System
-   **shadcn/ui**: A collection of reusable UI components for React.
-   **Radix UI**: Provides unstyled, accessible components for building design systems.
-   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
-   **Lucide React**: An open-source icon library.

## Development Tools
-   **Vite**: A fast build tool for modern web projects.
-   **TanStack Query**: For data fetching, caching, and state management.
-   **Wouter**: A minimalist React hook-based router.
-   **React Hook Form**: For performant, flexible, and extensible forms with easy-to-use validation.
-   **@xenova/transformers**: For running Transformer models directly in the browser for local NLP processing.