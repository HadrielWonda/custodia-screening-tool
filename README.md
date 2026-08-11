This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy the local environment template:

```bash
cp .env.example .env
```

Start Postgres in Docker:

```bash
npm run db:up
```

The default database URL is:

```text
postgresql://postgres:postgres@localhost:5433/custodia_screening_tool?schema=public
```

To enable the diabetes high-risk WhatsApp handoff, set `NEXT_PUBLIC_NURSE_WHATSAPP_NUMBER` to the nurse line in international format, digits only. If the number is missing or WhatsApp does not open, the result screen shows `NEXT_PUBLIC_NURSE_FALLBACK_CONTACT` instead.

The nurse dashboard is available at [http://localhost:3000/dashboard](http://localhost:3000/dashboard). Set `NURSE_DASHBOARD_PASSWORD` before signing in. `NURSE_DASHBOARD_SESSION_SECRET` signs the HTTP-only dashboard session cookie.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Check database connectivity at [http://localhost:3000/api/health](http://localhost:3000/api/health).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
