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

/**
 * Primeiro tenta parsing regex robusto (instantâneo).
 * Se o resultado parecer fraco, usa IA como refinamento.
 */
export async function parseArtistAndSong(
  title: string,
  channel: string
): Promise<SongInfo> {
  const regexResult = robustParse(title, channel);

  // Se o regex conseguiu separar artista e música com confiança, retorna direto
  if (regexResult.song && regexResult.artist && regexResult.artist !== channel) {
    return regexResult;
  }

  // Senão, tenta IA para refinar
  try {
    if (!process.env.OPENAI_API_KEY) return regexResult;

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
    return regexResult;
  }
}

/**
 * Parsing por texto direto (quando o usuário digita "Artista - Música")
 */
export function parseTextInput(text: string): SongInfo {
  return robustParse(text, "");
}

/* ──────────────────────────────────────────────
   Regex robusto para parsing de título
────────────────────────────────────────────── */

// Padrões a remover do título
const NOISE_PATTERNS = [
  /\(official\s*(music\s*)?video\)/gi,
  /\(clipe\s*oficial\)/gi,
  /\(ao\s*vivo\)/gi,
  /\(live\)/gi,
  /\(playback\)/gi,
  /\(legendado\)/gi,
  /\(letra\)/gi,
  /\(lyrics?\)/gi,
  /\(com\s*letra\)/gi,
  /\(cover\)/gi,
  /\(acoustic\)/gi,
  /\(acústico\)/gi,
  /\[official\s*(music\s*)?video\]/gi,
  /\[ao\s*vivo\]/gi,
  /\[hd\]/gi,
  /\[4k\]/gi,
  /\[legendado\]/gi,
  /\[letra\]/gi,
  /\[lyrics?\]/gi,
  /\#\w+/g,  // hashtags
  /\|\s*.*$/g,  // tudo depois de |
  /\s*ft\.\s*.+$/i,
  /\s*feat\.\s*.+$/i,
  /\s*part\.\s*.+$/i,
  /\s*c\/\s*.+$/i,
];

// Padrões que indicam "na voz de", "por", etc
const VOICE_PATTERNS = [
  /\s+na\s+voz\s+de\s+.*/gi,
  /\s+por\s+.*/gi,
];

function cleanTitle(title: string): string {
  let clean = title;
  for (const pattern of NOISE_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  // Remove conteúdo entre parênteses/colchetes residual
  clean = clean.replace(/\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "");
  return clean.replace(/\s+/g, " ").trim();
}

function robustParse(title: string, channel: string): SongInfo {
  let clean = cleanTitle(title);

  // Remove padrões "na voz de..." (mas captura o artista mencionado)
  let voiceArtist = "";
  for (const pattern of VOICE_PATTERNS) {
    const match = clean.match(pattern);
    if (match) {
      voiceArtist = match[0]
        .replace(/^\s+(na\s+voz\s+de|por)\s+/i, "")
        .trim();
      clean = clean.replace(pattern, "").trim();
    }
  }

  // Padrão 1: "Artista - Música" ou "Música - Artista"
  const dashMatch = clean.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    const [, left, right] = dashMatch;
    const leftTrimmed = left.trim();
    const rightTrimmed = right.trim();

    // Se o canal bate com um dos lados, esse lado é o artista
    const channelLower = channel.toLowerCase().trim();
    if (channelLower && leftTrimmed.toLowerCase().includes(channelLower)) {
      return { artist: leftTrimmed, song: rightTrimmed };
    }
    if (channelLower && rightTrimmed.toLowerCase().includes(channelLower)) {
      return { artist: rightTrimmed, song: leftTrimmed };
    }

    // Convenção: geralmente é "Artista - Música"
    return { artist: leftTrimmed, song: rightTrimmed };
  }

  // Padrão 2: "Música | Artista" (já tratado pelo NOISE_PATTERNS acima com |)

  // Padrão 3: Harpa Cristã — "HARPA CRISTÃ Hino 193: A Alma Abatida"
  const harpaMatch = clean.match(/harpa\s*cristã?\s*(?:hino\s*\d+\s*[:.]?\s*)?(.+)/i);
  if (harpaMatch) {
    return {
      artist: voiceArtist || "Harpa Cristã",
      song: harpaMatch[1].trim(),
    };
  }

  // Padrão 4: título com ":" — "Hino 193: A Alma Abatida"
  const colonMatch = clean.match(/^[^:]+:\s*(.+)$/);
  if (colonMatch) {
    return {
      artist: voiceArtist || channel || "",
      song: colonMatch[1].trim(),
    };
  }

  // Fallback: título inteiro é o nome da música, canal é o artista
  return {
    song: clean || title.trim(),
    artist: voiceArtist || channel || "",
  };
}
