"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

interface Stats {
  totalSongs: number;
  totalEvents: number;
  nextEvent: {
    id: string;
    name: string;
    date: string;
    repertoireItems: { id: string; key: string; song: { title: string; artist: string } }[];
  } | null;
  topSongs: { id: string; title: string; artist: string; _count: { plays: number } }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/stats")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load stats");
          return r.json();
        })
        .then(setStats)
        .catch(err => console.error(err));
    }
  }, [status]);

  if (status === "loading" || !session) {
    return <div className="min-h-screen bg-[--background] flex items-center justify-center text-[--muted-foreground]">Carregando...</div>;
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              Olá, {session.user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-[--muted-foreground] text-sm mt-1">Bem-vindo ao IBF Music Hub</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Importar Música", href: "/", icon: "📥", sub: "Paste YouTube links to sync chords" },
            { label: "Ver Acervo", href: "/acervo", icon: "🎵", sub: "Browse your complete music library" },
            { label: "Meu Perfil", href: "/profile", icon: "👤", sub: "Update instruments and preferences" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sanctuary-card p-5 group flex flex-col gap-2 hover:border-[--primary] transition-all"
            >
              <span className="text-3xl mb-1">{item.icon}</span>
              <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{item.label}</h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.sub}</p>
            </Link>
          ))}
        </div>

        {/* Stats & Top Songs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="sanctuary-card p-6 flex items-center justify-between overflow-hidden relative">
              <div>
                <p className="section-label mb-1">Total Music Library</p>
                <h2 className="text-5xl font-bold text-[--primary]">{stats?.totalSongs ?? "—"}</h2>
                <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>Músicas catalogadas no seu santuário</p>
              </div>
              <div className="text-8xl opacity-5 absolute right-[-20px] bottom-[-20px] select-none">🎵</div>
            </div>

            {/* Top Songs */}
            <div className="sanctuary-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Mais Tocadas</h3>
                <span className="badge">All Time</span>
              </div>
              {stats?.topSongs && stats.topSongs.length > 0 ? (
                <div className="space-y-4">
                  {stats.topSongs.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-4 group">
                      <span className="text-xl font-bold opacity-20 group-hover:opacity-40 transition-opacity w-6">0{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>{s.title}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.artist}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[--primary]">{s._count.plays}x</p>
                        <p className="text-[8px] uppercase tracking-widest leading-none" style={{ color: "var(--muted-foreground)" }}>PLAYS</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>Nenhuma atividade registrada ainda.</p>
              )}
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <div className="sanctuary-card p-6 bg-[--primary] text-white overflow-hidden relative border-none">
              <div className="relative z-10">
                <h3 className="font-serif italic text-lg mb-2">Stage Mode</h3>
                <p className="text-xs opacity-80 mb-4 leading-relaxed">Prepare for your next performance with our specialized high-contrast view.</p>
                <button className="text-xs font-bold py-2 px-4 rounded-full bg-white text-[--primary] hover:opacity-90">
                  Open Stage Mode
                </button>
              </div>
              <div className="absolute right-[-10px] bottom-[-10px] text-5xl opacity-20">🎸</div>
            </div>

            <div className="sanctuary-card p-6">
              <p className="section-label mb-3">Quick Tip</p>
              <p className="text-xs italic leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                "The goal of sacred music is not to impress, but to facilitate a moment of peace and reflection."
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
