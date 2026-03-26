import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) return { title: "Letra não encontrada" };
  return {
    title: `${song.title} — ${song.artist} | IBF Music Hub`,
    description: `Letra de ${song.title} por ${song.artist}`,
  };
}

export default async function LetraPage({ params }: Props) {
  const { id } = await params;
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) notFound();

  const stanzas: string[] = song.lyrics
    .split(/\n\n+/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0f;
      color: #e5e5f0;
      min-height: 100vh;
      padding: 0 0 80px;
    }
    .header {
      position: sticky; top: 0;
      background: rgba(10,10,15,0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      padding: 14px 24px;
      display: flex; align-items: center; justify-content: space-between;
      z-index: 10;
    }
    .brand { font-family: 'DM Serif Display', serif; font-size: 15px; color: #9b9bb0; letter-spacing: 0.05em; }
    .song-info { padding: 40px 24px 28px; max-width: 640px; margin: 0 auto; }
    .song-title { font-family: 'DM Serif Display', serif; font-size: 28px; line-height: 1.2; color: #f0f0ff; letter-spacing: -0.02em; margin-bottom: 6px; }
    .song-artist { font-size: 14px; color: #6b6b80; margin-bottom: 20px; }
    .yt-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #6b6b80; text-decoration: none; border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 20px; }
    .yt-link:hover { color: #e5e5f0; border-color: rgba(255,255,255,0.2); }
    .divider { height: 1px; background: rgba(255,255,255,0.06); max-width: 640px; margin: 0 auto 32px; }
    .lyrics { max-width: 640px; margin: 0 auto; padding: 0 24px; }
    .stanza { margin-bottom: 28px; }
    .stanza-line { font-size: 16px; line-height: 1.75; color: #c8c8e0; white-space: pre-wrap; }
    .footer { text-align: center; padding: 48px 24px 0; font-size: 11px; color: rgba(255,255,255,0.2); letter-spacing: 0.05em; }
    @media (max-width: 480px) { .song-title { font-size: 22px; } .stanza-line { font-size: 15px; } }
    @media print {
      body { background: white; color: #111; padding: 0; }
      .header { position: static; background: white; border: none; }
      .brand { color: #666; } .song-title { color: #111; } .song-artist { color: #555; } .stanza-line { color: #222; } .yt-link { display: none; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />

      <header className="header">
        <span className="brand">The Sanctuary</span>
        <span style={{ fontSize: "11px", color: "#4a4a5a", letterSpacing: "0.08em" }}>
          IBF MUSIC HUB
        </span>
      </header>

      <div className="song-info">
        <h1 className="song-title">{song.title}</h1>
        <p className="song-artist">{song.artist}</p>
        {song.youtubeUrl && (
          <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className="yt-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.5 12 21.5 12 21.5s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.2.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 14.7V9.3l5.6 2.7-5.6 2.7z"/>
            </svg>
            Ver no YouTube
          </a>
        )}
      </div>

      <div className="divider" />

      <div className="lyrics">
        {stanzas.map((stanza: string, i: number) => (
          <div key={i} className="stanza">
            {stanza.split("\n").map((line: string, j: number) => (
              <p key={j} className="stanza-line">
                {line || "\u00a0"}
              </p>
            ))}
          </div>
        ))}
      </div>

      <p className="footer">IBF MUSIC HUB · LETRA SALVA PELO MÚSICO</p>
    </>
  );
}
