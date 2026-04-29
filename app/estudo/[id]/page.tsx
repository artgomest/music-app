import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) return { title: "Material de Estudo" };
  return {
    title: `Estudo — ${song.title} | IBF Music Hub`,
    description: `Material de estudo para ${song.title} por ${song.artist}`,
  };
}

interface Instrument {
  slug: string;
  label: string;
  description: string;
  query: (title: string, artist: string) => string;
  icon: string;
  color: string;
}

const INSTRUMENTS: Instrument[] = [
  {
    slug: "violao",
    label: "Violão",
    description: "Cifras, tutoriais e aulas de violão",
    query: (t, a) => `${t} ${a} violão como tocar tutorial aula`,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3 L9 13 C7 13 4 15 4 18 C4 21 6.5 23 9.5 23 C12.5 23 15 21 15 18 C15 15 12 13 10 13 L10 3 Z"/>
      <line x1="9" y1="3" x2="10" y2="3"/>
      <line x1="9" y1="6" x2="10" y2="6"/>
      <line x1="9" y1="9" x2="10" y2="9"/>
    </svg>`,
    color: "#c084fc",
  },
  {
    slug: "guitarra",
    label: "Guitarra",
    description: "Riffs, solos e técnicas de guitarra",
    query: (t, a) => `${t} ${a} guitarra como tocar tutorial aula`,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 20 L14 10 M14 10 C14 10 16 8 18 8 C20 8 21 9 21 11 C21 13 20 14 18 14 C16 14 14 12 14 10"/>
      <circle cx="6" cy="18" r="2"/>
    </svg>`,
    color: "#f97316",
  },
  {
    slug: "baixo",
    label: "Baixo",
    description: "Linhas de baixo, grooves e técnicas",
    query: (t, a) => `${t} ${a} baixo como tocar tutorial aula`,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3 L9 13 C7 13 4 15 4 18 C4 21 6.5 23 9.5 23 C12.5 23 15 21 15 18 C15 15 12 13 10 13 L10 3 Z"/>
      <line x1="9" y1="3" x2="10" y2="3"/>
      <line x1="9" y1="7" x2="10" y2="7"/>
    </svg>`,
    color: "#22d3ee",
  },
  {
    slug: "teclado",
    label: "Teclado / Piano",
    description: "Harmonia, acordes e arranjos de teclado",
    query: (t, a) => `${t} ${a} teclado piano como tocar tutorial aula`,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="1"/>
      <line x1="7" y1="6" x2="7" y2="20"/>
      <line x1="12" y1="6" x2="12" y2="20"/>
      <line x1="17" y1="6" x2="17" y2="20"/>
      <rect x="4.5" y="6" width="2" height="8" rx="0.5" fill="currentColor" stroke="none"/>
      <rect x="9.5" y="6" width="2" height="8" rx="0.5" fill="currentColor" stroke="none"/>
      <rect x="14.5" y="6" width="2" height="8" rx="0.5" fill="currentColor" stroke="none"/>
      <rect x="19.5" y="6" width="2" height="8" rx="0.5" fill="currentColor" stroke="none"/>
    </svg>`,
    color: "#34d399",
  },
  {
    slug: "vocal",
    label: "Vocal / BV",
    description: "Melodias, back vocal e arranjos vocais",
    query: (t, a) => `${t} ${a} vocal back vocal backvocal como cantar tutorial`,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2 C9.8 2 8 3.8 8 6 L8 12 C8 14.2 9.8 16 12 16 C14.2 16 16 14.2 16 12 L16 6 C16 3.8 14.2 2 12 2 Z"/>
      <path d="M6 10 C6 10 6 16 12 16 C18 16 18 10 18 10"/>
      <line x1="12" y1="16" x2="12" y2="21"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
    </svg>`,
    color: "#fb7185",
  },
  {
    slug: "bateria",
    label: "Bateria / Percussão",
    description: "Beats, ritmos e técnicas de percussão",
    query: (t, a) => `${t} ${a} bateria percussão como tocar tutorial aula`,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="12" cy="14" rx="8" ry="4"/>
      <ellipse cx="12" cy="10" rx="8" ry="4"/>
      <line x1="4" y1="10" x2="4" y2="14"/>
      <line x1="20" y1="10" x2="20" y2="14"/>
      <line x1="9" y1="4" x2="7" y2="8"/>
      <line x1="15" y1="4" x2="17" y2="8"/>
    </svg>`,
    color: "#fbbf24",
  },
];

function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

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
  .back-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; color: #6b6b80; text-decoration: none;
    border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 20px;
    transition: color 0.15s, border-color 0.15s;
  }
  .back-link:hover { color: #e5e5f0; border-color: rgba(255,255,255,0.2); }
  .song-info { padding: 40px 24px 8px; max-width: 720px; margin: 0 auto; }
  .section-badge {
    display: inline-block; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: #6b6b80; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    padding: 3px 10px; border-radius: 20px; margin-bottom: 14px;
  }
  .song-title { font-family: 'DM Serif Display', serif; font-size: 28px; line-height: 1.2; color: #f0f0ff; letter-spacing: -0.02em; margin-bottom: 6px; }
  .song-artist { font-size: 14px; color: #6b6b80; margin-bottom: 4px; }
  .section-intro { padding: 28px 24px 20px; max-width: 720px; margin: 0 auto; }
  .section-title { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #4a4a5a; margin-bottom: 16px; }
  .grid {
    max-width: 720px; margin: 0 auto; padding: 0 24px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
  .card {
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 20px;
    background: rgba(255,255,255,0.02);
    display: flex; flex-direction: column; gap: 12px;
    transition: border-color 0.15s, background 0.15s;
  }
  .card:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); }
  .card-top { display: flex; align-items: center; gap: 10px; }
  .icon-wrap {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.05); flex-shrink: 0;
  }
  .card-label { font-size: 15px; font-weight: 500; color: #e5e5f0; }
  .card-desc { font-size: 12px; color: #6b6b80; line-height: 1.5; }
  .search-btn {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 500; text-decoration: none;
    padding: 7px 14px; border-radius: 8px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: #c8c8e0; transition: background 0.15s, border-color 0.15s, color 0.15s;
    align-self: flex-start;
  }
  .search-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #f0f0ff; }
  .yt-icon { opacity: 0.7; }
  .footer { text-align: center; padding: 48px 24px 0; font-size: 11px; color: rgba(255,255,255,0.2); letter-spacing: 0.05em; }
  .divider { height: 1px; background: rgba(255,255,255,0.06); max-width: 720px; margin: 0 auto 28px; }
`;

export default async function EstudoPage({ params }: Props) {
  const { id } = await params;
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) notFound();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />

      <header className="header">
        <span className="brand">The Sanctuary</span>
        <a href={`/letra/${id}`} className="back-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Voltar à letra
        </a>
      </header>

      <div className="song-info">
        <span className="section-badge">Material de Estudo</span>
        <h1 className="song-title">{song.title}</h1>
        <p className="song-artist">{song.artist}</p>
      </div>

      <div className="section-intro">
        <p className="section-title">Buscar tutoriais por instrumento</p>
      </div>

      <div className="divider" />

      <div className="grid">
        {INSTRUMENTS.map((inst) => {
          const url = youtubeSearchUrl(inst.query(song.title, song.artist));
          return (
            <div key={inst.slug} className="card">
              <div className="card-top">
                <div className="icon-wrap" style={{ color: inst.color }} dangerouslySetInnerHTML={{ __html: inst.icon }} />
                <span className="card-label">{inst.label}</span>
              </div>
              <p className="card-desc">{inst.description}</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="search-btn">
                <svg className="yt-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.5 12 21.5 12 21.5s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.2.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 14.7V9.3l5.6 2.7-5.6 2.7z"/>
                </svg>
                Buscar no YouTube
              </a>
            </div>
          );
        })}
      </div>

      <p className="footer">IBF MUSIC HUB · MATERIAL DE ESTUDO</p>
    </>
  );
}
