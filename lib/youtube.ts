export interface YouTubeVideoInfo {
  title: string;
  channel: string;
}

function normalizeYouTubeUrl(url: string): string {
  // Garante que URLs do tipo youtu.be/ID viram youtube.com/watch?v=ID
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${id}`;
    }
    // Remove parâmetros extra como &list=...&index=... (mantém só v=)
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/watch?v=${v}`;
    return url;
  } catch {
    return url;
  }
}

export async function fetchVideoTitle(url: string): Promise<YouTubeVideoInfo> {
  const cleanUrl = normalizeYouTubeUrl(url.trim());

  // Tentativa 1: oEmbed oficial do YouTube
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      return { title: data.title as string, channel: data.author_name as string };
    }
  } catch {
    // segue para próxima tentativa
  }

  // Tentativa 2: noembed.com (proxy alternativo)
  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(noembedUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data.title && !data.error) {
        return { title: data.title as string, channel: data.author_name as string ?? "" };
      }
    }
  } catch {
    // segue para próxima tentativa
  }

  // Tentativa 3: extrair ID do vídeo e retornar título genérico com o ID
  // Ao menos permite buscar a letra pelo ID
  try {
    const u = new URL(cleanUrl);
    const videoId = u.searchParams.get("v") ?? u.pathname.slice(1);
    if (videoId) {
      // Retorna o ID como título — o parseArtistAndSong vai lidar com isso
      return { title: videoId, channel: "" };
    }
  } catch {
    // nada
  }

  throw new Error("Não foi possível obter informações do vídeo. Verifique se o link do YouTube é válido e se o vídeo é público.");
}
