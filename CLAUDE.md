# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Data Maturity Assessment Tool built with Next.js 15. The application provides a comprehensive assessment system where organizations can evaluate their data maturity across 11 key dimensions. It supports role-based assessments, multilingual interface (English/Arabic), and generates personalized recommendations.

## Development Commands

- `npm run dev` - Start development server on port 3001 with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server on port 3001
- `npm run lint` - Run ESLint for code quality checks

## Architecture Overview

### Application Structure
The project follows Next.js App Router architecture with the following key directories:

- `/src/app/` - Next.js app router pages and API routes
- `/src/lib/` - Database connection and initialization utilities
- `/src/data/` - Static configuration data (questions, roles)
- `/src/utils/` - Utility functions
- `/public/` - Static assets

### Database Architecture
Uses SQLite with the following key tables:
- `assessment_codes` - Unique codes for assessment access
- `users` - User information and role selection
- `assessment_sessions` - Session management and progress tracking
- `user_responses` - Assessment question responses
- `assessment_results` - Final calculated results
- `audit_logs` - System activity logging

### Key Features
- **Role-based Assessment**: 5 different role types with customized question sets
- **Session Management**: Save/resume functionality with session persistence
- **Multi-language Support**: English and Arabic with RTL support
- **Code-based Access**: Secure access using assessment codes
- **Progress Tracking**: Real-time completion percentage
- **Results Generation**: Automated maturity level calculation and recommendations

### Database Connection
Database functions are in `src/lib/database.js` using sqlite3 with the `sqlite` wrapper. The database file `data_maturity.db` is stored in the project root.

### API Routes Structure
All API endpoints are in `/src/app/api/`:
- `/api/validate-code` - Validate assessment codes
- `/api/session` - Session management
- `/api/questions` - Fetch questions by role
- `/api/save-responses` - Save assessment responses
- `/api/calculate-scores` - Calculate final scores
- `/api/complete-assessment` - Mark assessment as complete
- `/api/results` - Retrieve assessment results

### Role Configuration
Role types are defined in `src/data/roles.js`:
- Executive/C-Suite (5 dimensions)
- IT/Technology (3 dimensions) 
- BI/Analytics (3 dimensions)
- Business Managers (3 dimensions)
- Data Governance (3 dimensions)

### Question Structure
Questions are organized by:
- 11 subdomains across 3 domain groups (Data Lifecycle, Governance & Protection, Organizational Enablers)
- 5-point maturity scale plus NA/NS options
- Role-specific question filtering

## Important Implementation Notes

- Port 3001 is used for both development and production (not the default 3000)
- The application uses ES modules (type: "module" in package.json)
- Database operations are asynchronous and use connection pooling
- All user responses include audit logging for compliance
- Assessment codes have expiration and usage limits
- Session management supports resuming incomplete assessments
- The system calculates maturity levels based on weighted scoring across dimensions