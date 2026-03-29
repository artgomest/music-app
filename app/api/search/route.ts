import { NextResponse } from "next/server";
import { fetchVideoTitle } from "@/lib/youtube";
import { parseArtistAndSong } from "@/lib/parse-title";
import { generateSearchLinks } from "@/lib/lyrics-links";
import {
  fetchLyricsFromLetras,
  fetchLyricsFromCifraClub,
  fetchLyricsFromVagalume,
  fetchLyricsFromOVH,
  fetchLyricsViaGoogle,
  fetchLyricsViaGoogleHtml,
} from "@/lib/fetch-lyrics";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { url, manualSongName } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL do YouTube é obrigatória." },
        { status: 400 }
      );
    }

    // ── 0. Cache do DB ─────────────────────────────────────────────
    const saved = await prisma.song.findFirst({ where: { youtubeUrl: url } });
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
        fallbackLinks: { cifraclub: saved.lyricsUrl, letras: saved.lyricsUrl, vagalumeSearch: "" },
      });
    }

    // ── 1. Título + artista do YouTube ────────────────────────────
    const videoInfo = await fetchVideoTitle(url);
    const parsed = await parseArtistAndSong(videoInfo.title, videoInfo.channel);
    const manualQuery = typeof manualSongName === "string" ? manualSongName.trim() : "";
    const song = manualQuery || parsed.song;
    const artist = parsed.artist;

    const fallbackLinks = generateSearchLinks(song, artist);

    let directLyrics: string | null = null;
    let lyricsUrl = "";
    let lyricsSource: "site" | "none" = "none";

    // Helper para tentar letras.mus.br com vários artistas
    async function tryLetras(artistName: string, songName: string) {
      const aSlug = slugify(artistName);
      const sSlug = slugify(songName);
      if (!aSlug || !sSlug) return null;
      const tryUrl = `https://www.letras.mus.br/${aSlug}/${sSlug}/`;
      const result = await fetchLyricsFromLetras(tryUrl);
      if (result) lyricsUrl = tryUrl;
      return result;
    }

    async function tryCifra(artistName: string, songName: string) {
      const aSlug = slugify(artistName);
      const sSlug = slugify(songName);
      if (!aSlug || !sSlug) return null;
      const tryUrl = `https://www.cifraclub.com.br/${aSlug}/${sSlug}/`;
      const result = await fetchLyricsFromCifraClub(tryUrl);
      if (result) lyricsUrl = tryUrl;
      return result;
    }

    // Gera candidatos de artista a partir do título e canal
    const artistCandidates = buildArtistCandidates(song, artist, videoInfo.title, videoInfo.channel);
    const songCandidates = buildSongCandidates(song, videoInfo.title, manualQuery);

    // Se usuário informou manualmente no formato "Artista - Música",
    // prioriza esse artista como candidato.
    if (manualQuery.includes("-")) {
      const manualArtist = manualQuery.split("-")[0]?.trim();
      if (manualArtist) {
        artistCandidates.unshift(manualArtist);
      }
    }

    // ── 2. letras.mus.br (múltiplas combinações) ──────────────────
    if (!directLyrics) {
      for (const a of artistCandidates) {
        for (const s of songCandidates) {
          directLyrics = await tryLetras(a, s);
          if (directLyrics) { lyricsSource = "site"; break; }
        }
        if (directLyrics) break;
      }
    }

    // ── 3. CifraClub (múltiplas combinações) ─────────────────────
    if (!directLyrics) {
      for (const a of artistCandidates) {
        for (const s of songCandidates) {
          directLyrics = await tryCifra(a, s);
          if (directLyrics) { lyricsSource = "site"; break; }
        }
        if (directLyrics) break;
      }
    }

    // ── 4. Vagalume API ───────────────────────────────────────────
    if (!directLyrics) {
      for (const a of artistCandidates) {
        for (const s of songCandidates) {
          const vag = await fetchLyricsFromVagalume(s, a);
          if (vag) {
            directLyrics = vag.lyrics;
            lyricsUrl = vag.url;
            lyricsSource = "site";
            break;
          }
        }
        if (directLyrics) break;
      }
    }

    // ── 5. lyrics.ovh ─────────────────────────────────────────────
    if (!directLyrics) {
      for (const a of artistCandidates) {
        for (const s of songCandidates) {
          directLyrics = await fetchLyricsFromOVH(s, a);
          if (directLyrics) {
            lyricsUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(a)}/${encodeURIComponent(s)}`;
            lyricsSource = "site";
            break;
          }
        }
        if (directLyrics) break;
      }
    }

    // ── 6. Google Custom Search ───────────────────────────────────
    if (!directLyrics) {
      const gResult = await fetchLyricsViaGoogle(song, artist);
      if (gResult) {
        directLyrics = gResult.lyrics;
        lyricsUrl = gResult.url;
        lyricsSource = "site";
      }
    }

    // ── 7. Google HTML Search (fallback sem API key) ──────────────
    if (!directLyrics) {
      const gHtmlResult = await fetchLyricsViaGoogleHtml(song, artist);
      if (gHtmlResult) {
        directLyrics = gHtmlResult.lyrics;
        lyricsUrl = gHtmlResult.url;
        lyricsSource = "site";
      }
    }

    return NextResponse.json({
      videoTitle: videoInfo.title,
      channel: videoInfo.channel,
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

  // 1. Artista detectado pela IA
  if (artist) candidates.add(artist);

  // 2. Canal do YouTube
  if (channel) candidates.add(channel);
  if (channel) {
    for (const normalized of normalizeArtistCandidate(channel)) {
      candidates.add(normalized);
    }
  }

  // 3. Extrai palavras-chave do título que parecem ser artistas/ministérios
  // Ex: "HARPA CRISTÃ Hino 193:A Alma Abatida na voz de Carlos José"
  const titleLower = rawTitle.toLowerCase();

  // Detecta padrão "ARTISTA - música"
  const dashParts = rawTitle.split(/\s*[-–]\s*/);
  if (dashParts.length >= 2) {
    candidates.add(dashParts[0].trim());
  }

  // Detecta "harpa crista", "harpa cristã"
  if (titleLower.includes("harpa")) candidates.add("Harpa Cristã");

  // Detecta "Ministério", "Comunidade", "Igreja"
  const ministryMatch = rawTitle.match(/(?:Ministério|Comunidade|Igreja|Coral|Grupo)\s+[\w\s]+/i);
  if (ministryMatch) candidates.add(ministryMatch[0].trim().split(/\s+/).slice(0, 3).join(" "));

  // 4. remove candidatos vazios
  candidates.delete("");
  candidates.delete(song); // evita artista = nome da música

  return [...candidates];
}

/**
 * Gera candidatos de nome de música a partir do título detectado + título raw do YouTube
 */
function buildSongCandidates(song: string, rawTitle: string, manualSongName?: string): string[] {
  const candidates = new Set<string>();

  // 0. Nome informado manualmente pelo usuário
  if (manualSongName) {
    const normalized = manualSongName
      .split("-")
      .slice(-1)
      .join("-")
      .trim();
    if (normalized) candidates.add(normalized);
  }

  // 1. Nome detectado pela IA
  if (song) candidates.add(song);

  // 2. Remove prefixos comuns do título bruto e usa o que sobra
  // Ex: "HARPA CRISTÃ Hino 193:A Alma Abatida na voz de Carlos José"
  const cleaned = rawTitle
    .replace(/harpa\s*cristã?\s*/gi, "")
    .replace(/hino\s*\d+\s*[:.]?\s*/gi, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\|.*$/g, "")
    .replace(/na\s+voz\s+de\s+[\w\s]+/gi, "")
    .replace(/por\s+[\w\s]+/gi, "")
    .replace(/(?:official\s*)?(?:music\s*)?video/gi, "")
    .replace(/ao\s+vivo/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned && cleaned !== song) candidates.add(cleaned);

  // 3. Parte após ":" no título (ex: "Hino 193:A Alma Abatida")
  const colonPart = rawTitle.split(/[:]/)[1];
  if (colonPart) {
    const part = colonPart.replace(/na\s+voz\s+de.*/gi, "").trim();
    if (part) candidates.add(part);
  }

  candidates.delete("");
  return [...candidates];
}

/**
 * Normaliza variações comuns de nomes de canal/artista.
 * Ex: "Fhop Music" => ["Fhop", "Fhop Music"]
 */
function normalizeArtistCandidate(value: string): string[] {
  const normalized = new Set<string>();
  const base = value
    .replace(/\|.*$/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!base) return [];
  normalized.add(base);

  const withoutSuffix = base
    .replace(/\b(official|oficial|music|música|channel|canal|tv|vevo)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (withoutSuffix) normalized.add(withoutSuffix);

  const beforePipe = value.split("|")[0]?.trim();
  if (beforePipe) normalized.add(beforePipe);

  return [...normalized];
}
