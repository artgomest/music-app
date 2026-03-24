export interface YouTubeVideoInfo {
  title: string;
  channel: string;
}

export async function fetchVideoTitle(url: string): Promise<YouTubeVideoInfo> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl);

  if (!res.ok) {
    throw new Error("Não foi possível obter informações do vídeo. Verifique se o link do YouTube é válido.");
  }

  const data = await res.json();
  return {
    title: data.title as string,
    channel: data.author_name as string,
  };
}
