import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export interface RepertoireEntry {
  song: string;
  artist: string;
  key: string;
  youtubeUrl: string;
  lyricsUrl: string;
  lyrics: string;
  lyricsSource: "site" | "drive" | "none";
}

/**
 * POST /api/repertoire
 * Salva músicas no acervo e retorna link do WhatsApp com links /letra/[id].
 */
export async function POST(req: Request) {
  try {
    const { entries }: { entries: RepertoireEntry[] } = await req.json();

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "Nenhuma música no repertório." }, { status: 400 });
    }

    // Descobre a base URL do app a partir dos headers da request
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") ?? "http";
    const baseUrl = `${proto}://${host}`;

    // Salva cada música no DB e coleta IDs
    const savedSongs: { entry: RepertoireEntry; songId: string }[] = [];

    for (const entry of entries) {
      try {
        const song = await prisma.song.upsert({
          where: { youtubeUrl: entry.youtubeUrl },
          update: {
            title: entry.song,
            artist: entry.artist,
            lyricsUrl: entry.lyricsUrl ?? "",
            lyrics: entry.lyrics ?? "",
          },
          create: {
            title: entry.song,
            artist: entry.artist,
            youtubeUrl: entry.youtubeUrl,
            lyricsUrl: entry.lyricsUrl ?? "",
            lyrics: entry.lyrics ?? "",
          },
        });
        savedSongs.push({ entry, songId: song.id });
      } catch (dbErr) {
        console.warn("[repertoire] Falha ao salvar no DB:", dbErr);
        // Ainda assim coloca na lista sem ID (usará lyricsUrl original)
        savedSongs.push({ entry, songId: "" });
      }
    }

    // Monta mensagem do WhatsApp
    const lines: string[] = ["🎵 *REPERTÓRIO IBF*\n"];

    savedSongs.forEach(({ entry, songId }, i) => {
      // Link da letra: se salvou no DB, usa /letra/[id]; senão usa o link do site
      const letraLink = songId
        ? `${baseUrl}/letra/${songId}`
        : entry.lyricsUrl;

      lines.push(`*${i + 1}. ${entry.song}*${entry.artist ? " — " + entry.artist : ""}`);
      lines.push(`🎼 Tom: ${entry.key}`);
      lines.push(`▶️ ${entry.youtubeUrl}`);
      if (letraLink) {
        lines.push(`📄 Letra: ${letraLink}`);
      }
      lines.push("");
    });

    const message = lines.join("\n");
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ waUrl, message });
  } catch (err) {
    console.error("[repertoire POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno." },
      { status: 500 }
    );
  }
}
