import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/stats - ministry-wide stats (events removed as per user request)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const [totalSongs, recentPlays] = await Promise.all([
    prisma.song.count(),
    prisma.songPlay.findMany({
      orderBy: { playedAt: "desc" },
      take: 20,
      include: {
        song: { select: { title: true, artist: true } },
      },
    }),
  ]);

  // Top 5 most played songs
  const topSongs = await prisma.song.findMany({
    include: { _count: { select: { plays: true } } },
    orderBy: { plays: { _count: "desc" } },
    take: 5,
  });

  return NextResponse.json({ 
    totalSongs, 
    totalEvents: 0, // Events retired
    recentPlays, 
    topSongs, 
    nextEvent: null // Events retired
  });
}
