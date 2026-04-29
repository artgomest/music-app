"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

interface SongWithStats {
  id: string;
  title: string;
  artist: string;
  youtubeUrl: string;
  lyricsUrl: string;
  createdAt: string;
  _count: { plays: number };
  plays: { playedAt: string }[];
}

const TAGS = ["KEY", "BPM", "GENRE", "WORSHIP", "HYMN", "CONTEMPORARY", "BALLAD"];

const getDeterministicTag = (song: SongWithStats): string => {
  const source = `${song.id}-${song.title}`;
  const hash = Array.from(source).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TAGS[hash % TAGS.length];
};

export default function AcervoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const timer = setTimeout(() => {
      fetch(`/api/songs?q=${encodeURIComponent(q)}`)
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load songs");
          return r.json();
        })
        .then((data) => {
          setSongs(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error(err);
          setSongs([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [q, status]);

  return (
    <AppShell>
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "var(--font-sans)", color: "var(--foreground)" }}
        >
          Music Library
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
          A curated collection of sacred melodies and contemporary arrangements for your sanctuary.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer hover:bg-[var(--accent)] transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            ☰ Filters
          </span>
          {["KEY", "BPM", "GENRE"].map((f) => (
            <span key={f} className="badge badge-amber cursor-pointer hover:opacity-80 transition-opacity">
              {f}
            </span>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by title or artist..."
              value={q}
              onChange={(e) => { setLoading(true); setQ(e.target.value); }}
              className="field-input pl-8"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="sanctuary-card animate-pulse" style={{ height: "260px" }} />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold mb-2">No songs yet</h3>
          <p style={{ color: "var(--muted-foreground)" }} className="text-sm mb-6">
            Import songs from the Import tab to build your library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {songs.map((song) => {
            const tag = getDeterministicTag(song);
            const key = ["D Major", "G Major", "Bb Major", "B Major", "A Major"][song.title.length % 5];
            const bpm = 60 + (song.title.charCodeAt(0) % 40);

            return (
              <div key={song.id} className="sanctuary-card overflow-hidden cursor-pointer group transition-shadow hover:shadow-md">
                <div
                  className="relative h-36 w-full overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, hsl(${song.title.charCodeAt(0) * 3 % 360},30%,40%) 0%, hsl(${(song.title.charCodeAt(0) * 5) % 360},40%,25%) 100%)`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-60">🎵</div>
                  <span
                    className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", color: "#fff" }}
                  >
                    {tag}
                  </span>
                  <button className="absolute top-2.5 right-2.5 text-white opacity-70 hover:opacity-100 text-sm">♡</button>
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2" style={{ color: "var(--foreground)" }}>
                      {song.title}
                    </h3>
                    <button className="text-[var(--muted-foreground)] text-sm shrink-0">♡</button>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                    {song.artist}
                  </p>
                  <div className="flex gap-3">
                    <div>
                      <p className="section-label" style={{ fontSize: "0.55rem" }}>KEY</p>
                      <p className="text-xs font-semibold">{key}</p>
                    </div>
                    <div>
                      <p className="section-label" style={{ fontSize: "0.55rem" }}>TEMPO</p>
                      <p className="text-xs font-semibold">{bpm} BPM</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
