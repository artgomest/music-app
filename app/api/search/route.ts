import { NextResponse } from "next/server";
import { fetchVideoTitle } from "@/lib/youtube";
import { parseArtistAndSong, parseTextInput } from "@/lib/parse-title";
import { generateSearchLinks } from "@/lib/lyrics-links";
import { fetchLyricsParallel } from "@/lib/fetch-lyrics";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, query } = body as { url?: string; query?: string };

    const input = (url || query || "").trim();
    if (!input) {
      return NextResponse.json(
        { error: "Informe uma URL do YouTube ou o nome da música." },
        { status: 400 }
      );
    }

    const isUrl = /^https?:\/\//i.test(input) || /youtu\.?be/i.test(input);

    // ── 0. Cache do DB (por URL ou por nome) ─────────────────────
    if (isUrl) {
      const saved = await prisma.song.findFirst({ where: { youtubeUrl: input } });
      if (saved?.lyrics) {
        return NextResponse.json({
          videoTitle: saved.title,
          channel: saved.artist,
          parsedSong: saved.title,
          parsedArtist: saved.artist,
          directLyrics: saved.lyrics,
          lyricsUrl: saved.lyricsUrl,
          lyricsSource: "saved" as const,
          fromCache: true,
          fallbackLinks: generateSearchLinks(saved.title, saved.artist),
        });
      }
    } else {
      // Busca por texto: tenta encontrar no banco pelo nome
      const parsed = parseTextInput(input);
      const dbResults = await prisma.song.findMany({
        where: {
          OR: [
            { title: { contains: parsed.song } },
            { artist: { contains: parsed.artist || parsed.song } },
            { title: { contains: input } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      });

      // Se alguma já tem letra, retorna direto
      const withLyrics = dbResults.find((s) => s.lyrics);
      if (withLyrics) {
        return NextResponse.json({
          videoTitle: withLyrics.title,
          channel: withLyrics.artist,
          parsedSong: withLyrics.title,
          parsedArtist: withLyrics.artist,
          directLyrics: withLyrics.lyrics,
          lyricsUrl: withLyrics.lyricsUrl,
          lyricsSource: "saved" as const,
          fromCache: true,
          fallbackLinks: generateSearchLinks(withLyrics.title, withLyrics.artist),
        });
      }
    }

    // ── 1. Obter artista + música ────────────────────────────────
    let song: string;
    let artist: string;
    let videoTitle: string;
    let channelName: string;

    if (isUrl) {
      const videoInfo = await fetchVideoTitle(input);
      const parsed = await parseArtistAndSong(videoInfo.title, videoInfo.channel);
      song = parsed.song;
      artist = parsed.artist;
      videoTitle = videoInfo.title;
      channelName = videoInfo.channel;
    } else {
      const parsed = parseTextInput(input);
      song = parsed.song;
      artist = parsed.artist;
      videoTitle = input;
      channelName = artist;
    }

    const fallbackLinks = generateSearchLinks(song, artist);

    // ── 2. Busca de candidatos ──────────────────────────────────
    const artistCandidates = buildArtistCandidates(song, artist, videoTitle, channelName);
    const songCandidates = buildSongCandidates(song, videoTitle);

    // ── 3. Busca paralela de letra ──────────────────────────────
    const lyricsResult = await fetchLyricsParallel(song, artist, artistCandidates, songCandidates);

    const directLyrics = lyricsResult?.lyrics ?? null;
    const lyricsUrl = lyricsResult?.url ?? "";
    const lyricsSource: "site" | "none" = lyricsResult ? "site" : "none";

    // ── 4. Auto-save: persiste no banco se encontrou letra ──────
    if (directLyrics && song) {
      const youtubeUrl = isUrl ? input : "";
      try {
        if (youtubeUrl) {
          await prisma.song.upsert({
            where: { youtubeUrl },
            create: { title: song, artist, youtubeUrl, lyricsUrl, lyrics: directLyrics },
            update: { lyrics: directLyrics, lyricsUrl, title: song, artist },
          });
        } else {
          // Busca por texto: cria registro com URL placeholder única (youtubeUrl é @unique)
          const existing = await prisma.song.findFirst({
            where: { title: song, artist },
          });
          if (!existing) {
            await prisma.song.create({
              data: {
                title: song,
                artist,
                youtubeUrl: `text://${Date.now()}-${song}`,
                lyricsUrl,
                lyrics: directLyrics,
              },
            });
          } else if (!existing.lyrics) {
            await prisma.song.update({
              where: { id: existing.id },
              data: { lyrics: directLyrics, lyricsUrl },
            });
          }
        }
      } catch {
        // Auto-save é best-effort, não bloqueia a resposta
      }
    }

    return NextResponse.json({
      videoTitle,
      channel: channelName,
      parsedSong: song,
      parsedArtist: artist,
      fallbackLinks,
      directLyrics,
      lyricsUrl,
      lyricsSource,
      fromCache: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar letra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Gera candidatos de nome de artista a partir do nome detectado + título do vídeo + canal
 */
function buildArtistCandidates(song: string, artist: string, rawTitle: string, channel: string): string[] {
  const candidates = new Set<string>();

  if (artist) candidates.add(artist);
  if (channel) candidates.add(channel);

  const titleLower = rawTitle.toLowerCase();

  const dashParts = rawTitle.split(/\s*[-–]\s*/);
  if (dashParts.length >= 2) {
    candidates.add(dashParts[0].trim());
  }

  if (titleLower.includes("harpa")) candidates.add("Harpa Cristã");

  const ministryMatch = rawTitle.match(/(?:Ministério|Comunidade|Igreja|Coral|Grupo)\s+[\w\s]+/i);
  if (ministryMatch) candidates.add(ministryMatch[0].trim().split(/\s+/).slice(0, 3).join(" "));

  candidates.delete("");
  candidates.delete(song);

  return [...candidates];
}

/**
 * Gera candidatos de nome de música a partir do título detectado + título raw do YouTube
 */
function buildSongCandidates(song: string, rawTitle: string): string[] {
  const candidates = new Set<string>();

  if (song) candidates.add(song);

  const cleaned = rawTitle
    .replace(/harpa\s*cristã?\s*/gi, "")
    .replace(/hino\s*\d+\s*[:.]?\s*/gi, "")
    .replace(/\(.*?\)/g, "")
    .replace(/na\s+voz\s+de\s+[\w\s]+/gi, "")
    .replace(/por\s+[\w\s]+/gi, "")
    .replace(/(?:official\s*)?(?:music\s*)?video/gi, "")
    .replace(/ao\s+vivo/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned && cleaned !== song) candidates.add(cleaned);

  const colonPart = rawTitle.split(/[:]/)[1];
  if (colonPart) {
    const part = colonPart.replace(/na\s+voz\s+de.*/gi, "").trim();
    if (part) candidates.add(part);
  }

  candidates.delete("");
  return [...candidates];
}
