import * as cheerio from "cheerio";

export async function fetchLyricsFromLetras(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!res.ok) {
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Letras.mus.br often uses .lyric-original or .lyric as the main container for the lyrics.
    let lyrics = "";
    
    // Attempt selectors
    const original = $(".lyric-original");
    if (original.length > 0) {
      original.find("p").each((_, p) => {
        lyrics += $(p).html()?.replace(/<br\s*\/?>/gi, "\n") + "\n\n";
      });
    } else {
      const lyric = $(".lyric");
      if (lyric.length > 0) {
        lyric.find("p").each((_, p) => {
          lyrics += $(p).html()?.replace(/<br\s*\/?>/gi, "\n") + "\n\n";
        });
      }
    }

    if (!lyrics) return null;

    // Decode HTML entities and clean up text
    lyrics = lyrics.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

    return lyrics;
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return null;
  }
}
