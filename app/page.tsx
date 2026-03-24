"use client";

import { useState } from "react";
import { Reorder } from "framer-motion";
import AppShell from "@/components/AppShell";

interface SearchResponse {
  videoTitle: string;
  channel: string;
  parsedSong: string;
  parsedArtist: string;
  results: { id: string; song: string; artist: string; url: string }[];
  fallbackLinks: { cifraclub: string; letras: string; vagalumeSearch: string };
  directLyrics?: string | null;
}

interface RepertoireItem {
  song: string;
  artist: string;
  key: string;
  youtubeUrl: string;
  lyricsUrl: string;
}

const KEYS = [
  "Original", "-1/2 Tom", "+1/2 Tom", "-1 Tom", "+1 Tom",
  "-1 1/2 Tom", "+1 1/2 Tom", "-2 Tons", "+2 Tons",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([]);
  const [addingToRepertoire, setAddingToRepertoire] = useState(false);

  type ApprovalStatus = "pending" | "approved" | "rejected" | "editing";
  const [lyricsApproval, setLyricsApproval] = useState<ApprovalStatus>("pending");
  const [lyricsStanzas, setLyricsStanzas] = useState<{ id: string; text: string }[]>([]);
  const [finalLyrics, setFinalLyrics] = useState<string | null>(null);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    setAddingToRepertoire(false);
    setLyricsApproval("pending");
    setFinalLyrics(null);
    setLyricsStanzas([]);
    setActiveBlock(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro desconhecido.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  }

  function handleStartEditing() {
    const source = data?.directLyrics || "";
    const stanzas = source
      .split(/\n\n+/)
      .filter((s) => s.trim())
      .map((text) => ({ id: crypto.randomUUID(), text: text.trim() }));
    setLyricsStanzas(
      stanzas.length > 0
        ? stanzas
        : [{ id: crypto.randomUUID(), text: "Letra não encontrada... insira o bloco de texto." }]
    );
    setLyricsApproval("editing");
  }

  function duplicateStanza(id: string) {
    const index = lyricsStanzas.findIndex((s) => s.id === id);
    if (index === -1) return;
    const newStanzas = [...lyricsStanzas];
    newStanzas.splice(index + 1, 0, { id: crypto.randomUUID(), text: lyricsStanzas[index].text });
    setLyricsStanzas(newStanzas);
    setActiveBlock(null);
  }

  function deleteStanza(id: string) {
    setLyricsStanzas((prev) => prev.filter((s) => s.id !== id));
    setActiveBlock(null);
  }

  function finishEditing() {
    const assembledText = lyricsStanzas.map((s) => s.text).join("\n\n");
    setFinalLyrics(assembledText);
    setLyricsApproval("approved");
    setAddingToRepertoire(true);
  }

  function handleAddKey(key: string) {
    if (!data) return;
    setRepertoire((prev) => [
      ...prev,
      {
        song: data.parsedSong || data.videoTitle,
        artist: data.parsedArtist || data.channel,
        key,
        youtubeUrl: url,
        lyricsUrl: data.fallbackLinks.cifraclub || data.fallbackLinks.letras,
      },
    ]);
    setUrl("");
    setData(null);
    setAddingToRepertoire(false);
    setLyricsApproval("pending");
    setFinalLyrics(null);
    setLyricsStanzas([]);
    setActiveBlock(null);
  }

  function handleFinishRepertoire() {
    let msg = "REPERTÓRIO\n\n";
    repertoire.forEach((item) => {
      msg += `[${item.song} - ${item.artist}] (${item.key})\n`;
      msg += `${item.youtubeUrl}\n`;
      msg += `${item.lyricsUrl}\n\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function removeRepertoireItem(index: number) {
    setRepertoire((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRepertoireKey(index: number, newKey: string) {
    setRepertoire((prev) => {
      const copy = [...prev];
      copy[index].key = newKey;
      return copy;
    });
  }

  return (
    <AppShell
      setlist={repertoire.map((r) => ({ title: r.song, key: r.key }))}
      onExportWhatsApp={repertoire.length > 0 ? handleFinishRepertoire : undefined}
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Hero Import Card ── */}
        <div
          className="relative rounded-2xl overflow-hidden p-8"
          style={{
            background: "linear-gradient(135deg, #1A1A2E 0%, #2D3A8C 60%, #3D5AF1 100%)",
            minHeight: "220px",
          }}
        >
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
              Bring your worship music<br />
              to the{" "}
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#E07B3A" }}>
                Sanctuary.
              </span>
            </h1>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
              Paste a YouTube link to automatically transcribe, transpose, and organize your next setlist.
            </p>

            {/* Import input */}
            <form onSubmit={handleSearch}>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/..."
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    backdropFilter: "blur(8px)",
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
                  style={{ background: "#fff", color: "var(--primary)" }}
                >
                  {loading ? "..." : "Import"}
                </button>
              </div>
            </form>
          </div>

          {/* Decorative circles */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: "white", transform: "translate(30%, -30%)" }}
          />
          <div
            className="absolute bottom-0 right-24 w-32 h-32 rounded-full opacity-10"
            style={{ background: "white", transform: "translateY(40%)" }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.2)",
              color: "var(--destructive)",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="sanctuary-card p-6 space-y-3 animate-pulse">
            <div className="h-4 rounded" style={{ background: "var(--border)", width: "60%" }} />
            <div className="h-3 rounded" style={{ background: "var(--border)", width: "40%" }} />
            <div className="h-3 rounded" style={{ background: "var(--border)" }} />
            <div className="h-3 rounded" style={{ background: "var(--border)" }} />
          </div>
        )}

        {/* ── Result: song found ── */}
        {data && lyricsApproval === "pending" && (
          <div className="sanctuary-card p-6 animate-fade-up">
            {/* Song info */}
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: "var(--accent)" }}
              >
                🎵
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-lg leading-tight" style={{ color: "var(--foreground)" }}>
                      {data.parsedSong || data.videoTitle}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {data.parsedArtist || data.channel}
                    </p>
                  </div>
                  {data.directLyrics && (
                    <span className="badge badge-amber shrink-0">Letra Encontrada</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lyrics preview */}
            {data.directLyrics && (
              <div
                className="rounded-xl p-4 mb-5 text-sm leading-relaxed max-h-64 overflow-y-auto"
                style={{ background: "var(--input)", color: "var(--foreground)", whiteSpace: "pre-wrap" }}
              >
                {data.directLyrics}
              </div>
            )}

            {!data.directLyrics && (
              <div className="rounded-xl p-4 mb-5 text-sm text-center" style={{ background: "var(--input)", color: "var(--muted-foreground)" }}>
                Letra não encontrada automaticamente.
              </div>
            )}

            {/* Approve / Reject Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setLyricsApproval("approved"); setAddingToRepertoire(true); setFinalLyrics(data.directLyrics ?? ""); }}
                className="btn-primary flex items-center gap-2"
              >
                ✓ Confirmar letra
              </button>
              <button
                onClick={handleStartEditing}
                className="btn-ghost flex items-center gap-2"
              >
                ✏️ Montar letra
              </button>
              <button
                onClick={() => { setData(null); setLyricsApproval("pending"); }}
                className="btn-ghost flex items-center gap-2"
                style={{ color: "var(--destructive)", borderColor: "rgba(220,38,38,0.3)" }}
              >
                ✕ Rejeitar
              </button>
            </div>
          </div>
        )}

        {/* ── Drag & Drop Editor ── */}
        {lyricsApproval === "editing" && (
          <div className="sanctuary-card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                ✏️ Montar Letra
              </h3>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Arraste para reordenar os blocos
              </span>
            </div>
            <Reorder.Group
              axis="y"
              values={lyricsStanzas}
              onReorder={setLyricsStanzas}
              className="space-y-3"
            >
              {lyricsStanzas.map((stanza) => (
                <Reorder.Item
                  key={stanza.id}
                  value={stanza}
                  className="rounded-xl cursor-grab active:cursor-grabbing"
                  style={{
                    background: activeBlock === stanza.id ? "var(--accent)" : "var(--input)",
                    border: `1px solid ${activeBlock === stanza.id ? "var(--primary)" : "var(--border)"}`,
                    padding: "0.875rem 1rem",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onClick={() => setActiveBlock(activeBlock === stanza.id ? null : stanza.id)}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>
                    {stanza.text}
                  </p>
                  {activeBlock === stanza.id && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateStanza(stanza.id); }}
                        className="text-xs px-3 py-1 rounded-lg font-medium"
                        style={{ background: "var(--primary)", color: "#fff" }}
                      >
                        Duplicar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteStanza(stanza.id); }}
                        className="text-xs px-3 py-1 rounded-lg font-medium"
                        style={{ background: "rgba(220,38,38,0.1)", color: "var(--destructive)" }}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <div className="flex gap-3 mt-5">
              <button onClick={finishEditing} className="btn-primary">
                ✓ Finalizar
              </button>
              <button
                onClick={() => setLyricsApproval("pending")}
                className="btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── Key Selection ── */}
        {lyricsApproval === "approved" && addingToRepertoire && (
          <div className="sanctuary-card p-6 animate-fade-up">
            <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              🎵 Adicionar ao Setlist
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
              {data?.parsedSong || data?.videoTitle} — escolha o tom:
            </p>
            <div className="flex flex-wrap gap-2">
              {KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => handleAddKey(key)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: key === "Original" ? "var(--primary)" : "var(--input)",
                    color: key === "Original" ? "#fff" : "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    if (key !== "Original") {
                      (e.target as HTMLElement).style.background = "var(--accent)";
                      (e.target as HTMLElement).style.borderColor = "var(--primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (key !== "Original") {
                      (e.target as HTMLElement).style.background = "var(--input)";
                      (e.target as HTMLElement).style.borderColor = "var(--border)";
                    }
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        {!data && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "📄", label: "Upload Chord Sheet", sub: "PDF or Text files supported" },
              {
                icon: "🔀", label: "Smart Transpose",
                sub: "Instantly shift any song to match your lead vocalist's range.",
              },
              { icon: "📊", label: "Library Health", sub: "Track your most-used songs and keys." },
            ].map((card) => (
              <div key={card.label} className="sanctuary-card p-5 cursor-pointer hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{card.icon}</div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>
                  {card.label}
                </h3>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {card.sub}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Current setlist (mobile) ── */}
        {repertoire.length > 0 && (
          <div className="sanctuary-card p-5 lg:hidden animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                Current Setlist
              </h3>
              <button
                onClick={handleFinishRepertoire}
                className="btn-primary text-xs py-1.5 px-3"
              >
                WhatsApp
              </button>
            </div>
            <div className="space-y-2">
              {repertoire.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: "var(--input)" }}
                >
                  <span className="text-xs w-5 shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.song}</p>
                  </div>
                  <select
                    value={item.key}
                    onChange={(e) => updateRepertoireKey(i, e.target.value)}
                    className="text-[10px] font-semibold rounded px-1 py-0.5 outline-none cursor-pointer"
                    style={{ background: "var(--accent)", color: "var(--primary)", border: "none" }}
                  >
                    {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <button
                    onClick={() => removeRepertoireItem(i)}
                    className="text-xs shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
