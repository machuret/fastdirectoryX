# Business Directory Platform

This project is a serverless business directory platform built with Next.js, Vercel, Neon (Postgres), and NextAuth.js.

## Core Technologies

- **Frontend:** Next.js (React)
- **UI Style:** Tailwind CSS
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** Neon (Serverless Postgres)
- **Authentication:** NextAuth.js
- **Deployment:** Vercel

## Project Structure (Initial)

- `/pages`: Next.js pages (frontend routes and API routes)
  - `/api`: Serverless functions
- `/components`: Reusable React components
- `/lib`: Helper functions, database utilities, etc.
- `/public`: Static assets (images, fonts)
- `/styles`: Global styles and Tailwind CSS setup
- `/prisma`: Prisma schema and migrations (for Neon DB)

## Next Steps

1. Initialize npm/yarn and install dependencies.
2. Configure Prisma for Neon database.
3. Set up NextAuth.js for authentication.
4. Develop frontend UI for browsing and admin panel.
5. Implement backend API endpoints.
6. Build the data import module.
