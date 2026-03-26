import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/* ──────────────────────────────────────────────
   1. letras.mus.br
────────────────────────────────────────────── */
export async function fetchLyricsFromLetras(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;

    const $ = cheerio.load(await res.text());
    let lyrics = "";

    const container = $(".lyric-original").length
      ? $(".lyric-original")
      : $(".lyric");

    container.find("p").each((_, p) => {
      lyrics += $(p).html()!.replace(/<br\s*\/?>/gi, "\n") + "\n\n";
    });

    return clean(lyrics) || null;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────
   2. CifraClub
────────────────────────────────────────────── */
export async function fetchLyricsFromCifraClub(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" },
    });
    if (!res.ok) return null;

    const $ = cheerio.load(await res.text());
    let lyrics = "";

    $(".letra p, .cifra_cnt p").each((_, el) => {
      lyrics += $(el).html()!.replace(/<br\s*\/?>/gi, "\n") + "\n\n";
    });

    if (!lyrics) {
      $("pre").each((_, el) => {
        lyrics += $(el).text() + "\n\n";
      });
    }

    return clean(lyrics) || null;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────
   3. Vagalume — letra completa via scraping da página
────────────────────────────────────────────── */
export async function fetchLyricsFromVagalume(
  song: string,
  artist: string
): Promise<{ lyrics: string; url: string } | null> {
  try {
    // Primeiro busca o link via API
    const params = new URLSearchParams({ musica: song, ...(artist ? { art: artist } : {}), limit: "1" });
    const searchRes = await fetch(`https://api.vagalume.com.br/search.php?${params}`);
    if (!searchRes.ok) return null;

    const data = await searchRes.json();
    const doc = data.doc ?? data.docs?.[0];
    if (!doc) return null;

    const pageUrl = `https://www.vagalume.com.br${doc.url}`;

    // Depois busca a letra via API de letra direta
    const lyricsRes = await fetch(
      `https://api.vagalume.com.br/search.php?musica=${encodeURIComponent(doc.sing)}&art=${encodeURIComponent(doc.art?.name ?? artist)}&nolyrics=0`
    );
    if (!lyricsRes.ok) return null;

    const lData = await lyricsRes.json();
    const text: string | undefined = lData.mus?.[0]?.letra;
    if (!text) return null;

    return { lyrics: text.trim(), url: pageUrl };
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────
   4. lyrics.ovh — API gratuita, sem chave
────────────────────────────────────────────── */
export async function fetchLyricsFromOVH(
  song: string,
  artist: string
): Promise<string | null> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = await res.json();
    const lyrics: string = data.lyrics ?? "";
    return lyrics.trim() || null;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────
   5. Google Custom Search  (opcional — requer chave)
   Scrapa o primeiro resultado que pareça uma página de letra
────────────────────────────────────────────── */
export async function fetchLyricsViaGoogle(
  song: string,
  artist: string
): Promise<{ lyrics: string; url: string; source: string } | null> {
  const gApiKey = process.env.GOOGLE_API_KEY;
  const gCseId = process.env.GOOGLE_CSE_ID;

  if (!gApiKey || !gCseId) return null;

  try {
    const q = encodeURIComponent(`letra ${song} ${artist} site:letras.mus.br OR site:cifraclub.com.br OR site:vagalume.com.br OR site:genius.com`);
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${gApiKey}&cx=${gCseId}&q=${q}&num=5`;

    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    const items: { link: string; displayLink: string }[] = data.items ?? [];

    for (const item of items) {
      const link = item.link;
      let lyrics: string | null = null;

      if (link.includes("letras.mus.br")) {
        lyrics = await fetchLyricsFromLetras(link);
      } else if (link.includes("cifraclub.com.br")) {
        lyrics = await fetchLyricsFromCifraClub(link);
      } else if (link.includes("vagalume.com.br")) {
        lyrics = await scrapeVagalumePage(link);
      } else if (link.includes("genius.com")) {
        lyrics = await scrapeGeniusPage(link);
      }

      if (lyrics) {
        return { lyrics, url: link, source: item.displayLink };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function scrapeVagalumePage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const $ = cheerio.load(await res.text());
    const text = $("#lyricContent").text().trim();
    return text || null;
  } catch {
    return null;
  }
}

async function scrapeGeniusPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const $ = cheerio.load(await res.text());
    let lyrics = "";
    $("[data-lyrics-container='true']").each((_, el) => {
      lyrics += $(el).html()!.replace(/<br\s*\/?>/gi, "\n") + "\n\n";
    });
    return clean(lyrics) || null;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────
   Utilitário: limpar HTML residual e entidades
────────────────────────────────────────────── */
function clean(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
