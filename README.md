# Omnisight Analytics

**Omnisight Analytics** is a data-driven insights and analytics tools platform built with Next.js 15. The platform provides organizations with comprehensive tools to evaluate and improve their data capabilities.

## Featured Tools

### Data Maturity Assessment (`/dma`)
Our flagship tool that helps organizations evaluate their data maturity across 11 key dimensions:
- Role-based assessment tailored to your position
- Multilingual support (English/Arabic with RTL)
- Instant maturity score and detailed analysis
- Actionable recommendations for improvement

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd omnisight-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3001"
```

4. Initialize the database:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the application.

## Development Commands

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build the application for production
- `npm run start` - Start production server on port 3001
- `npm run lint` - Run ESLint for code quality checks
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio for database management

## Architecture

The platform is designed to support multiple analytics tools:
- `/dma` - Data Maturity Assessment
- Future tools: Forecasting, Data Quality Assessment, and more

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Tech Stack

- **Framework**: Next.js 15.4.8 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: React 19 with Chart.js for visualizations
- **Styling**: CSS with custom properties

## Deploy on Vercel

The easiest way to deploy this application is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

This project is proprietary software owned by Omnisight Analytics.
