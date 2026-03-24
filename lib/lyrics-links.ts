import { slugify } from "./utils";

export interface LyricsSearchLinks {
  cifraclub: string;
  letras: string;
  vagalumeSearch: string;
}

export function generateSearchLinks(
  song: string,
  artist: string
): LyricsSearchLinks {
  const query = [artist, song].filter(Boolean).join(" ");
  const encoded = encodeURIComponent(query);

  const artistSlug = slugify(artist);
  const songSlug = slugify(song);

  const letras = (artistSlug && songSlug) 
    ? `https://www.letras.mus.br/${artistSlug}/${songSlug}/`
    : `https://www.letras.mus.br/?q=${encoded}#gsc.tab=0&gsc.q=${encoded}`;

  const cifraclub = (artistSlug && songSlug)
    ? `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/`
    : `https://www.cifraclub.com.br/busca/?q=${encoded}`;

  return {
    cifraclub,
    letras,
    vagalumeSearch: `https://www.vagalume.com.br/busca/?q=${encoded}`,
  };
}
