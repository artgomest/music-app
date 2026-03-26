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

  const stanzas = song.lyrics
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', sans-serif;
            background: #0a0a0f;
            color: #e5e5f0;
            min-height: 100vh;
            padding: 0 0 80px;
          }
          .header {
            position: sticky;
            top: 0;
            background: rgba(10,10,15,0.92);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,0.07);
            padding: 14px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 10;
          }
          .brand {
            font-family: 'DM Serif Display', serif;
            font-size: 15px;
            color: #9b9bb0;
            letter-spacing: 0.05em;
          }
          .song-info {
            padding: 40px 24px 28px;
            max-width: 640px;
            margin: 0 auto;
          }
          .song-title {
            font-family: 'DM Serif Display', serif;
            font-size: 28px;
            line-height: 1.2;
            color: #f0f0ff;
            letter-spacing: -0.02em;
            margin-bottom: 6px;
          }
          .song-artist {
            font-size: 14px;
            color: #6b6b80;
            margin-bottom: 20px;
          }
          .yt-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #6b6b80;
            text-decoration: none;
            border: 1px solid rgba(255,255,255,0.08);
            padding: 5px 12px;
            border-radius: 20px;
            transition: color 0.2s, border-color 0.2s;
          }
          .yt-link:hover { color: #e5e5f0; border-color: rgba(255,255,255,0.2); }
          .divider {
            height: 1px;
            background: rgba(255,255,255,0.06);
            max-width: 640px;
            margin: 0 auto 32px;
          }
          .lyrics {
            max-width: 640px;
            margin: 0 auto;
            padding: 0 24px;
          }
          .stanza {
            margin-bottom: 28px;
          }
          .stanza-line {
            font-size: 16px;
            line-height: 1.75;
            color: #c8c8e0;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            padding: 48px 24px 0;
            font-size: 11px;
            color: rgba(255,255,255,0.2);
            letter-spacing: 0.05em;
          }
          @media (max-width: 480px) {
            .song-title { font-size: 22px; }
            .stanza-line { font-size: 15px; }
          }
          @media print {
            body { background: white; color: #111; padding: 0; }
            .header { position: static; background: white; border: none; }
            .brand { color: #666; }
            .song-title { color: #111; }
            .song-artist { color: #555; }
            .stanza-line { color: #222; }
            .yt-link { display: none; }
          }
        `}</style>
      </head>
      <body>
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
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="yt-link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.75 12.23 12.23 0 00-1.64-.11C8.38 3.83 4 8.15 4 13.5A8.5 8.5 0 0012.5 22a8.31 8.31 0 007.5-4.9c.07-.22.06-.46-.04-.68l-.37-.73z" opacity=".3"/>
                <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.27.09.59-.11.82l-2.81 3.14c.27.6.42 1.26.42 1.9 0 2.61-2.13 4.74-4.74 4.74a4.73 4.73 0 01-4.11-2.42L7 17.6A9.49 9.49 0 0012.5 22 9.5 9.5 0 0022 12.5c0-2.01-.63-3.87-1.7-5.4l-.74.07z"/>
              </svg>
              Ver no YouTube
            </a>
          )}
        </div>

        <div className="divider" />

        <div className="lyrics">
          {stanzas.map((stanza, i) => (
            <div key={i} className="stanza">
              {stanza.split("\n").map((line, j) => (
                <p key={j} className="stanza-line">
                  {line || "\u00a0"}
                </p>
              ))}
            </div>
          ))}
        </div>

        <p className="footer">IBF MUSIC HUB · LETRA SALVA PELO MÚSICO</p>
      </body>
    </html>
  );
}
