import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export interface SongInfo {
  song: string;
  artist: string;
}

const schema = z.object({
  song: z.string().describe("Nome limpo da música, sem sufixos como 'Official Video', 'HD', etc."),
  artist: z.string().describe("Nome do artista ou banda. Se não for identificável, retorne string vazia."),
});

export async function parseArtistAndSong(
  title: string,
  channel: string
): Promise<SongInfo> {
  try {
    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema }),
      prompt: `Você é um assistente especializado em identificar músicas gospel e cristãs.

Dado o título do vídeo do YouTube e o nome do canal, extraia o nome da música e o artista/ministério.

Título: "${title}"
Canal: "${channel}"

Regras:
- Remova sufixos como: (Official Video), (Ao Vivo), [HD], (Legendado), (Playback), ft., feat., etc.
- Para músicas gospel brasileiras, o canal costuma ser o ministério/artista
- Se o título tiver "Artista - Nome da Música", separe corretamente
- Retorne os nomes limpos e sem caracteres especiais desnecessários`,
    });

    return output as SongInfo;
  } catch {
    // Fallback: regex simples se a IA falhar
    return fallbackParse(title, channel);
  }
}

function fallbackParse(title: string, channel: string): SongInfo {
  // Remove sufixos comuns
  const clean = title
    .replace(/\(official\s*(music\s*)?video\)/gi, "")
    .replace(/\(ao vivo\)/gi, "")
    .replace(/\[hd\]/gi, "")
    .replace(/\(legendado\)/gi, "")
    .replace(/\(playback\)/gi, "")
    .replace(/\s*ft\..*$/i, "")
    .replace(/\s*feat\..*$/i, "")
    .trim();

  // Tenta separar "Artista - Música"
  const parts = clean.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), song: parts.slice(1).join(" - ").trim() };
  }

  return { song: clean, artist: channel };
}
