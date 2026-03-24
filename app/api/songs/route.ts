import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET /api/songs - list all songs (acervo)
export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const songs = await prisma.song.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q } },
            { artist: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      plays: { orderBy: { playedAt: "desc" }, take: 1 },
      _count: { select: { plays: true } },
    },
  });

  return NextResponse.json(songs);
}

// POST /api/songs - save a song to the acervo
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const { title, artist, youtubeUrl, lyricsUrl, lyrics } = await req.json();

    if (!title || !artist || !youtubeUrl) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    // Check for existing song with same YouTube URL
    const existing = await prisma.song.findFirst({ where: { youtubeUrl } });

    const song = existing
      ? await prisma.song.update({
          where: { id: existing.id },
          data: { lyricsUrl: lyricsUrl ?? "", lyrics: lyrics ?? "" },
        })
      : await prisma.song.create({
          data: {
            title,
            artist,
            youtubeUrl,
            lyricsUrl: lyricsUrl ?? "",
            lyrics: lyrics ?? "",
          },
        });


    return NextResponse.json(song);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
