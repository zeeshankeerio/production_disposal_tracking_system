# Production Tracker

A full-featured production tracking application for bakeries and food service operations. Track products, production entries, and disposals in one place.

## Features

- Dashboard with production analytics and reports
- Product management with categories and units
- Production entry tracking with expiration dates
- Disposal tracking with reason codes
- Integrated data entry forms

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm
- Supabase account for database storage

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/production-tracker.git
cd production-tracker
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a Supabase project (see [SUPABASE-SETUP-GUIDE.md](SUPABASE-SETUP-GUIDE.md) for detailed instructions)

4. Create a `.env.local` file with your Supabase credentials:

```
# Server-side environment variables
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Client-side environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

> **IMPORTANT:** Use the HTTP URL format (https://your-project-id.supabase.co) for SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL, not the PostgreSQL connection string. See [SUPABASE-TROUBLESHOOTING.md](SUPABASE-TROUBLESHOOTING.md) for more details.

5. Initialize your database:

```bash
npm run setup-db
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

For detailed deployment instructions, see [VERCEL-DEPLOYMENT-GUIDE.md](VERCEL-DEPLOYMENT-GUIDE.md).

Quick steps:
1. Push your repository to GitHub
2. Import the project to Vercel
3. Add environment variables in Vercel project settings:
   ```
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Deploy
5. Visit the deployed application and go to the Settings page
6. Initialize the database using the interface

The application will automatically check for environment variables during build. If any required variables are missing in production, the build will fail to prevent deploying without proper configuration.

## Usage

- Use the **Dashboard** for an overview of production and disposal metrics
- Use the **Products** page to manage your product catalog
- Use the **Production** page to track daily production
- Use the **Disposal** page to record product disposals and reasons
- Use the **Entries** page to add both production and disposal entries in one place
- Use the **Settings** page to check database connectivity and initialize the database

## Customization

The application can be customized through several configuration files:

- `lib/config.ts`: Application settings, including UI configuration and data refresh intervals
- `lib/types.ts`: Data type definitions

## License

This project is licensed under the MIT License - see the LICENSE file for details. 