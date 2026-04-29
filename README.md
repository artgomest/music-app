This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

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

CREATE TABLE "User" (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'musician',
  instruments TEXT NOT NULL DEFAULT '',
  "avatarUrl" TEXT,
  notes       TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Song" (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  artist       TEXT NOT NULL,
  "youtubeUrl" TEXT NOT NULL UNIQUE,
  "lyricsUrl"  TEXT NOT NULL DEFAULT '',
  lyrics       TEXT NOT NULL DEFAULT '',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Event" (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  date          TIMESTAMP(3) NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("createdById") REFERENCES "User"(id)
);

CREATE TABLE "RepertoireItem" (
  id        TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "songId"  TEXT NOT NULL,
  key       TEXT NOT NULL DEFAULT 'Original',
  "order"   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("eventId") REFERENCES "Event"(id) ON DELETE CASCADE,
  FOREIGN KEY ("songId")  REFERENCES "Song"(id)
);

CREATE TABLE "SongPlay" (
  id        TEXT PRIMARY KEY,
  "songId"  TEXT NOT NULL,
  "userId"  TEXT NOT NULL,
  "eventId" TEXT,
  "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("songId") REFERENCES "Song"(id),
  FOREIGN KEY ("userId") REFERENCES "User"(id)
);
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
