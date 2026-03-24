import { NextResponse } from "next/server";
import { fetchVideoTitle } from "@/lib/youtube";
import { parseArtistAndSong } from "@/lib/parse-title";
import { searchVagalume } from "@/lib/vagalume";
import { generateSearchLinks } from "@/lib/lyrics-links";
import { fetchLyricsFromLetras } from "@/lib/fetch-lyrics";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL do YouTube é obrigatória." },
        { status: 400 }
      );
    }

    // 1. Fetch YouTube title via oEmbed (no API key needed)
    const videoInfo = await fetchVideoTitle(url);

    // 2. Use AI to extract clean song name + artist
    const { song, artist } = await parseArtistAndSong(
      videoInfo.title,
      videoInfo.channel
    );

    // 3. Search Vagalume for direct lyrics links
    const vagalumeResults = await searchVagalume(song, artist);

    // 4. Generate fallback search links for other sites
    const fallbackLinks = generateSearchLinks(song, artist);

    // 5. Actually try to fetch lyrics from letras.mus.br link directly
    let directLyrics = null;
    if (fallbackLinks.letras.indexOf("?q=") === -1) {
       // Only try to fetch if we successfully structured a direct artist/song URL
       directLyrics = await fetchLyricsFromLetras(fallbackLinks.letras);
    }

    return NextResponse.json({
      videoTitle: videoInfo.title,
      channel: videoInfo.channel,
      parsedSong: song,
      parsedArtist: artist,
      results: vagalumeResults,
      fallbackLinks,
      directLyrics, // Included so frontend can render directly
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao buscar letra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

