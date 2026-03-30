import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/* ──────────────────────────────────────────────
   Resultado unificado de busca de letra
────────────────────────────────────────────── */
export interface LyricsResult {
  lyrics: string;
  url: string;
  source: string;
}

/* ──────────────────────────────────────────────
   Busca paralela em todas as fontes
   Executa em ondas: BR → Internacional → Google
────────────────────────────────────────────── */
export async function fetchLyricsParallel(
  song: string,
  artist: string,
  artistCandidates: string[],
  songCandidates: string[]
): Promise<LyricsResult | null> {
  const brTasks: Array<() => Promise<LyricsResult | null>> = [];
  const intlTasks: Array<() => Promise<LyricsResult | null>> = [];

  for (const a of artistCandidates) {
    for (const s of songCandidates) {
      const aSlug = slugifyForUrl(a);
      const sSlug = slugifyForUrl(s);

      if (aSlug && sSlug) {
        const letrasUrl = `https://www.letras.mus.br/${aSlug}/${sSlug}/`;
        brTasks.push(async () => {
          const lyrics = await fetchLyricsFromLetras(letrasUrl);
          return lyrics ? { lyrics, url: letrasUrl, source: "letras.mus.br" } : null;
        });

        const cifraUrl = `https://www.cifraclub.com.br/${aSlug}/${sSlug}/`;
        brTasks.push(async () => {
          const lyrics = await fetchLyricsFromCifraClub(cifraUrl);
          return lyrics ? { lyrics, url: cifraUrl, source: "cifraclub.com.br" } : null;
        });
      }

      brTasks.push(async () => {
        const result = await fetchLyricsFromVagalume(s, a);
        return result ? { ...result, source: "vagalume.com.br" } : null;
      });

      intlTasks.push(async () => {
        const lyrics = await fetchLyricsFromOVH(s, a);
        if (!lyrics) return null;
        return {
          lyrics,
          url: `https://api.lyrics.ovh/v1/${encodeURIComponent(a)}/${encodeURIComponent(s)}`,
          source: "lyrics.ovh",
        };
      });
    }
  }

  // Onda 1: fontes BR em paralelo
  const brResult = await raceForResult(brTasks);
  if (brResult) return brResult;

  // Onda 2: lyrics.ovh em paralelo
  const intlResult = await raceForResult(intlTasks);
  if (intlResult) return intlResult;

  // Onda 3: Google Custom Search (último recurso)
  const googleResult = await fetchLyricsViaGoogle(song, artist);
  if (googleResult) return googleResult;

  return null;
}

/** Executa todas as tasks em paralelo e retorna o primeiro resultado não-null */
async function raceForResult(
  tasks: Array<() => Promise<LyricsResult | null>>
): Promise<LyricsResult | null> {
  if (tasks.length === 0) return null;
  const results = await Promise.allSettled(tasks.map((fn) => fn()));
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) return r.value;
  }
  return null;
}

/** Slugify para URLs de sites de letras */
function slugifyForUrl(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
