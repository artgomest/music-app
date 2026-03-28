"use client";

import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import AppShell from "@/components/AppShell";

/* ─ Types ─ */
interface SearchResponse {
  videoTitle: string;
  channel: string;
  parsedSong: string;
  parsedArtist: string;
  directLyrics: string | null;
  lyricsUrl: string;
  lyricsSource: "site" | "none" | "saved";
  fromCache?: boolean;
  fallbackLinks: { cifraclub: string; letras: string; vagalumeSearch: string };
}

interface RepertoireEntry {
  song: string;
  artist: string;
  key: string;
  youtubeUrl: string;
  lyricsUrl: string;
  lyrics: string;
  lyricsSource: "site" | "drive" | "none";
}

interface MedleyLinkItem {
  id: string;
  url: string;
}

interface MedleyStanza {
  id: string;
  text: string;
}

const KEYS = [
  "Original", "-½ Tom", "+½ Tom", "-1 Tom", "+1 Tom",
  "-1½ Tom", "+1½ Tom", "-2 Tons", "+2 Tons",
];

/* ─ SVG Icons ─ */
const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 10V2M5 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 13h12" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 00-5.9 10.72L1 15l3.38-1.08A7 7 0 108 1zm0 1.4a5.6 5.6 0 11-3.88 9.57l-.22-.22-2 .64.66-1.93-.24-.34A5.6 5.6 0 018 2.4zm-1.6 3a.5.5 0 00-.37.17l-.11.13c-.27.3-.68.77-.68 1.45 0 .72.47 1.42.68 1.7l.02.03c.48.67 1.13 1.28 1.85 1.65.36.19.7.3.98.35.46.08.88 0 1.2-.18.47-.25.75-.67.83-1.1l.03-.22a.25.25 0 00-.15-.26l-1.47-.67a.25.25 0 00-.3.08l-.37.48c-.07.09-.18.1-.27.06-.47-.2-1.08-.71-1.43-1.2a.2.2 0 01.02-.28l.36-.4a.25.25 0 00.04-.29l-.67-1.5a.25.25 0 00-.19-.14z"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M11 2l3 3-8 8H3v-3L11 2z" strokeLinejoin="round"/>
  </svg>
);
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
  </svg>
);
const IconGrab = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="4" cy="3" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="6" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="9" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="8" cy="3" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="8" cy="6" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="8" cy="9" r="0.8" fill="currentColor" stroke="none"/>
  </svg>
);
const IconSaved = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 2h8l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
    <path d="M6 2v4h5" strokeLinecap="round"/>
    <path d="M5 10h6M5 13h4" strokeLinecap="round"/>
  </svg>
);

// ── Helpers de persistência ──────────────────────────────────────────────
function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function Home() {
  // ── State (restaurado do localStorage na primeira renderização) ──
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repertoire, setRepertoire] = useState<RepertoireEntry[]>([]);
  const [finishing, setFinishing] = useState(false);

  // Lyrics edit mode
  type EditState = "idle" | "editing";
  const [editState, setEditState] = useState<EditState>("idle");
  const [lyricsStanzas, setLyricsStanzas] = useState<{ id: string; text: string }[]>([]);
  const [editedLyrics, setEditedLyrics] = useState<string | null>(null);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  // Key selection
  const [selectedKey, setSelectedKey] = useState("Original");

  // Medley builder
  type MedleyStep = "links" | "stanzas";
  const [medleyOpen, setMedleyOpen] = useState(false);
  const [medleyStep, setMedleyStep] = useState<MedleyStep>("links");
  const [medleyLoading, setMedleyLoading] = useState(false);
  const [medleyLinks, setMedleyLinks] = useState<MedleyLinkItem[]>([
    { id: crypto.randomUUID(), url: "" },
    { id: crypto.randomUUID(), url: "" },
  ]);
  const [medleyStanzas, setMedleyStanzas] = useState<MedleyStanza[]>([]);
  const [activeMedleyStanza, setActiveMedleyStanza] = useState<string | null>(null);
  const [medleyTitle, setMedleyTitle] = useState("Medley");

  // ── Hidratação única do localStorage ───────────────────────────────────
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setRepertoire(loadLS<RepertoireEntry[]>("ibf_repertoire", []));
    const savedData = loadLS<SearchResponse | null>("ibf_current_data", null);
    const savedUrl  = loadLS<string>("ibf_current_url", "");
    const savedKey  = loadLS<string>("ibf_current_key", "Original");
    const savedEdited = loadLS<string | null>("ibf_edited_lyrics", null);
    setData(savedData);
    setUrl(savedUrl);
    setSelectedKey(savedKey);
    setEditedLyrics(savedEdited);
    setHydrated(true);
  }, []);

  // ── Persistência automática sempre que o estado mudar ──────────────────
  useEffect(() => { if (hydrated) saveLS("ibf_repertoire", repertoire); }, [repertoire, hydrated]);
  useEffect(() => { if (hydrated) saveLS("ibf_current_data", data); }, [data, hydrated]);
  useEffect(() => { if (hydrated) saveLS("ibf_current_url", url); }, [url, hydrated]);
  useEffect(() => { if (hydrated) saveLS("ibf_current_key", selectedKey); }, [selectedKey, hydrated]);
  useEffect(() => { if (hydrated) saveLS("ibf_edited_lyrics", editedLyrics); }, [editedLyrics, hydrated]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    setEditState("idle");
    setEditedLyrics(null);
    setSelectedKey("Original");
    setLoadingMsg("Buscando música no YouTube…");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      setLoadingMsg("Procurando a letra…");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro desconhecido.");
      setLoadingMsg("");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }

  function startEditing() {
    const source = editedLyrics ?? data?.directLyrics ?? "";
    const stanzas = source
      .split(/\n\n+/)
      .filter((s) => s.trim())
      .map((text) => ({ id: crypto.randomUUID(), text: text.trim() }));
    setLyricsStanzas(
      stanzas.length > 0
        ? stanzas
        : [{ id: crypto.randomUUID(), text: "Insira o bloco de texto aqui." }]
    );
    setEditState("editing");
    setActiveBlock(null);
  }

  function finishEditing() {
    const assembled = lyricsStanzas.map((s) => s.text).join("\n\n");
    setEditedLyrics(assembled);
    setEditState("idle");
  }

  function duplicateStanza(id: string) {
    const index = lyricsStanzas.findIndex((s) => s.id === id);
    if (index === -1) return;
    const copy = [...lyricsStanzas];
    copy.splice(index + 1, 0, { id: crypto.randomUUID(), text: lyricsStanzas[index].text });
    setLyricsStanzas(copy);
    setActiveBlock(null);
  }

  function deleteStanza(id: string) {
    setLyricsStanzas((prev) => prev.filter((s) => s.id !== id));
    setActiveBlock(null);
  }

  function openMedleyBuilder() {
    setMedleyOpen(true);
    setMedleyStep("links");
    setMedleyLoading(false);
    setMedleyStanzas([]);
    setActiveMedleyStanza(null);
  }

  function closeMedleyBuilder() {
    setMedleyOpen(false);
    setMedleyStep("links");
    setMedleyLoading(false);
    setMedleyStanzas([]);
    setActiveMedleyStanza(null);
  }

  function addMedleyLink() {
    setMedleyLinks((prev) => [...prev, { id: crypto.randomUUID(), url: "" }]);
  }

  function removeMedleyLink(id: string) {
    setMedleyLinks((prev) => prev.filter((item) => item.id !== id));
  }

  function duplicateMedleyStanza(id: string) {
    const index = medleyStanzas.findIndex((s) => s.id === id);
    if (index === -1) return;
    const copy = [...medleyStanzas];
    copy.splice(index + 1, 0, { id: crypto.randomUUID(), text: medleyStanzas[index].text });
    setMedleyStanzas(copy);
    setActiveMedleyStanza(null);
  }

  function deleteMedleyStanza(id: string) {
    setMedleyStanzas((prev) => prev.filter((s) => s.id !== id));
    setActiveMedleyStanza(null);
  }

  function editMedleyStanza(id: string) {
    const stanza = medleyStanzas.find((s) => s.id === id);
    if (!stanza) return;
    const edited = window.prompt("Edite a estrofe:", stanza.text);
    if (edited === null) return;
    setMedleyStanzas((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: edited.trim() || s.text } : s))
    );
    setActiveMedleyStanza(null);
  }

  function mergeMedleyWithNext(id: string) {
    const index = medleyStanzas.findIndex((s) => s.id === id);
    if (index < 0 || index >= medleyStanzas.length - 1) return;
    const copy = [...medleyStanzas];
    const current = copy[index];
    const next = copy[index + 1];
    copy[index] = { ...current, text: `${current.text}\n\n${next.text}` };
    copy.splice(index + 1, 1);
    setMedleyStanzas(copy);
    setActiveMedleyStanza(null);
  }

  async function handleMedleyNextStep() {
    const urls = medleyLinks.map((l) => l.url.trim()).filter(Boolean);
    if (urls.length < 2) {
      setError("Adicione pelo menos 2 links para criar o medley.");
      return;
    }

    setError(null);
    setMedleyLoading(true);

    try {
      const responses = await Promise.all(
        urls.map(async (link) => {
          const res = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: link }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Erro ao buscar músicas do medley.");
          return { link, data: json as SearchResponse };
        })
      );

      const allStanzas: MedleyStanza[] = [];
      responses.forEach(({ data }, idx) => {
        const title = data.parsedSong || data.videoTitle || `Música ${idx + 1}`;
        const artist = data.parsedArtist || data.channel || "Artista";
        const blocks = (data.directLyrics ?? "")
          .split(/\n\n+/)
          .map((s) => s.trim())
          .filter(Boolean);

        if (blocks.length === 0) {
          allStanzas.push({
            id: crypto.randomUUID(),
            text: `[${title} — ${artist}]\n(sem letra automática, edite este bloco)`,
          });
          return;
        }

        blocks.forEach((block, blockIdx) => {
          allStanzas.push({
            id: crypto.randomUUID(),
            text: blockIdx === 0 ? `[${title} — ${artist}]\n${block}` : block,
          });
        });
      });

      setMedleyTitle(`Medley: ${responses.map((r) => r.data.parsedSong || r.data.videoTitle).slice(0, 3).join(" / ")}`);
      setMedleyStanzas(allStanzas.length ? allStanzas : [{ id: crypto.randomUUID(), text: "Insira as estrofes do medley aqui." }]);
      setMedleyStep("stanzas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao montar medley.");
    } finally {
      setMedleyLoading(false);
    }
  }

  function handleAddMedleyToRepertoire() {
    if (medleyStanzas.length === 0) return;
    const links = medleyLinks.map((l) => l.url.trim()).filter(Boolean);
    const medleyLyrics = medleyStanzas.map((s) => s.text).join("\n\n");

    setRepertoire((prev) => [
      ...prev,
      {
        song: medleyTitle,
        artist: "Medley",
        key: "Original",
        youtubeUrl: links[0] || `https://youtube.com/watch?v=medley-${Date.now()}`,
        lyricsUrl: "",
        lyrics: medleyLyrics,
        lyricsSource: "none",
      },
    ]);

    closeMedleyBuilder();
    setMedleyLinks([
      { id: crypto.randomUUID(), url: "" },
      { id: crypto.randomUUID(), url: "" },
    ]);
  }

  function handleAddToRepertoire() {
    if (!data) return;
    const finalLyrics = editedLyrics ?? data.directLyrics ?? "";
    setRepertoire((prev) => [
      ...prev,
      {
        song: data.parsedSong || data.videoTitle,
        artist: data.parsedArtist || data.channel,
        key: selectedKey,
        youtubeUrl: url,
        lyricsUrl: data.lyricsUrl ?? "",
        lyrics: finalLyrics,
        lyricsSource: (data.lyricsSource === "site" ? "site" : "none") as "site" | "drive" | "none",
      },
    ]);
    // Reset para próxima música
    setUrl("");
    setData(null);
    setEditState("idle");
    setEditedLyrics(null);
    setSelectedKey("Original");
  }

  async function handleFinish() {
    if (repertoire.length === 0) return;
    setFinishing(true);
    try {
      const res = await fetch("/api/repertoire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: repertoire }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao finalizar.");
      // Limpa o repertório salvo após compartilhar
      ["ibf_repertoire","ibf_current_data","ibf_current_url","ibf_current_key","ibf_edited_lyrics"]
        .forEach(k => localStorage.removeItem(k));
      setRepertoire([]);
      setData(null);
      setUrl("");
      setSelectedKey("Original");
      setEditedLyrics(null);
      window.open(json.waUrl, "_blank");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao finalizar.");
    } finally {
      setFinishing(false);
    }
  }

  const currentLyrics = editedLyrics ?? data?.directLyrics ?? null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── STEP 1: Import input ── */}
        <div
          className="rounded-xl p-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between gap-3 mb-1">
            <h1
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
            >
              {repertoire.length === 0 ? "Importar uma música" : "Adicionar outra música"}
            </h1>
            <button onClick={openMedleyBuilder} className="btn-ghost text-xs gap-1.5">
              <IconPlus /> Criar Medley
            </button>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--foreground-muted)" }}>
            Cole o link do YouTube para buscar a letra automaticamente.
          </p>
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="field-input flex-1"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary shrink-0 gap-1.5"
              >
                <IconUpload />
                {loading ? "Buscando…" : "Buscar"}
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-xs"
            style={{
              background: "var(--destructive-subtle)",
              border: "1px solid var(--destructive-border)",
              color: "var(--destructive)",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div
            className="p-5 rounded-xl space-y-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {loadingMsg && (
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                {loadingMsg}
              </p>
            )}
            <div className="animate-pulse space-y-3">
              <div className="h-3.5 rounded" style={{ background: "var(--surface-3)", width: "55%" }} />
              <div className="h-2.5 rounded" style={{ background: "var(--surface-3)", width: "35%" }} />
              <div className="h-2.5 rounded" style={{ background: "var(--surface-3)" }} />
              <div className="h-2.5 rounded" style={{ background: "var(--surface-3)", width: "70%" }} />
              <div className="h-2.5 rounded" style={{ background: "var(--surface-3)", width: "50%" }} />
            </div>
          </div>
        )}

        {/* ── STEP 2: Letra encontrada ── */}
        {data && editState === "idle" && (
          <div
            className="rounded-xl overflow-hidden animate-fade-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-start justify-between gap-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <h2
                  className="font-semibold text-sm"
                  style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
                >
                  {data.parsedSong || data.videoTitle}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                  {data.parsedArtist || data.channel}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {data.fromCache && (
                  <span className="badge gap-1">
                    <IconSaved /> Salva
                  </span>
                )}
                {currentLyrics ? (
                  <span className="badge badge-green">Letra encontrada</span>
                ) : (
                  <span className="badge badge-red">Sem letra</span>
                )}
              </div>
            </div>

            {/* Letra */}
            {currentLyrics ? (
              <div
                className="px-5 py-4 text-xs leading-relaxed max-h-72 overflow-y-auto"
                style={{ color: "var(--foreground-muted)", whiteSpace: "pre-wrap" }}
              >
                {currentLyrics}
              </div>
            ) : (
              <div
                className="px-5 py-6 text-center text-xs"
                style={{ color: "var(--foreground-subtle)" }}
              >
                Letra não encontrada automaticamente.<br/>
                <button
                  onClick={startEditing}
                  className="btn-ghost text-xs mt-3 gap-1.5"
                >
                  <IconEdit /> Inserir letra manualmente
                </button>
              </div>
            )}

            {/* Ações da letra */}
            {currentLyrics && (
              <div
                className="px-5 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <button
                  onClick={startEditing}
                  className="btn-ghost text-xs gap-1.5"
                >
                  <IconEdit /> Editar letra
                </button>
              </div>
            )}

            {/* Tom */}
            <div
              className="px-5 py-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="section-label mb-2">Escolha o tom</p>
              <div className="flex flex-wrap gap-1.5">
                {KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={selectedKey === key ? "btn-primary text-xs py-1.5 px-3" : "btn-ghost text-xs py-1.5 px-3"}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão adicionar */}
            <div
              className="px-5 py-4 flex"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                onClick={handleAddToRepertoire}
                className="btn-primary gap-2"
              >
                <IconPlus />
                {repertoire.length === 0 ? "Adicionar letra no repertório" : "Adicionar outra música"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2b: Editor drag & drop ── */}
        {data && editState === "editing" && (
          <div
            className="rounded-xl animate-fade-up overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
              >
                Montar Letra
              </h3>
              <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                Clique para selecionar · Arraste para reordenar
              </span>
            </div>

            <div className="p-4">
              <Reorder.Group
                axis="y"
                values={lyricsStanzas}
                onReorder={setLyricsStanzas}
                className="space-y-2"
              >
                {lyricsStanzas.map((stanza) => (
                  <Reorder.Item
                    key={stanza.id}
                    value={stanza}
                    className="rounded-lg cursor-grab active:cursor-grabbing"
                    style={{
                      background: activeBlock === stanza.id ? "var(--surface-3)" : "var(--surface-2)",
                      border: `1px solid ${activeBlock === stanza.id ? "var(--border-hover)" : "var(--border)"}`,
                      padding: "0.75rem",
                    }}
                    onClick={() => setActiveBlock(activeBlock === stanza.id ? null : stanza.id)}
                  >
                    <div className="flex items-start gap-2">
                      <span style={{ color: "var(--foreground-subtle)", marginTop: "2px", flexShrink: 0 }}>
                        <IconGrab />
                      </span>
                      <p
                        className="text-xs leading-relaxed whitespace-pre-wrap flex-1"
                        style={{ color: "var(--foreground-muted)" }}
                      >
                        {stanza.text}
                      </p>
                    </div>
                    {activeBlock === stanza.id && (
                      <div className="flex gap-2 mt-3 ml-5">
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateStanza(stanza.id); }}
                          className="btn-ghost text-xs py-1 px-2.5"
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteStanza(stanza.id); }}
                          className="btn-ghost text-xs py-1 px-2.5"
                          style={{ color: "var(--destructive)", borderColor: "var(--destructive-border)" }}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            <div
              className="px-5 py-3 flex gap-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button onClick={finishEditing} className="btn-primary text-xs gap-2">
                <IconCheck /> Confirmar
              </button>
              <button
                onClick={() => setEditState("idle")}
                className="btn-ghost text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Botão finalizar ── */}
        {repertoire.length > 0 && !data && (
          <div
            className="rounded-xl p-5 animate-fade-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={handleFinish}
              disabled={finishing}
              className="btn-primary w-full justify-center gap-2"
              style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
            >
              <IconWhatsApp />
              {finishing ? "Preparando…" : "Finalizar e mandar no WhatsApp"}
            </button>
          </div>
        )}

        {/* ── Resumo do repertório ── */}
        {repertoire.length > 0 && (
          <div
            className="rounded-xl overflow-hidden animate-fade-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
              >
                Repertório
              </h3>
              <span className="section-label">{repertoire.length} música{repertoire.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="p-3 space-y-1.5">
              {repertoire.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{ background: "var(--surface-2)" }}
                >
                  <span
                    className="text-xs w-5 shrink-0 tabular-nums"
                    style={{ color: "var(--foreground-subtle)" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.song}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--foreground-subtle)" }}
                    >
                      {item.artist}
                    </p>
                  </div>
                  <select
                    value={item.key}
                    onChange={(e) => {
                      const copy = [...repertoire];
                      copy[i] = { ...copy[i], key: e.target.value };
                      setRepertoire(copy);
                    }}
                    className="text-xs rounded px-1.5 py-0.5 outline-none cursor-pointer shrink-0"
                    style={{
                      background: "var(--surface-3)",
                      color: "var(--foreground-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <button
                    onClick={() => setRepertoire((prev) => prev.filter((_, idx) => idx !== i))}
                    className="btn-icon shrink-0"
                    style={{ width: "24px", height: "24px", border: "none" }}
                    aria-label="Remover"
                  >
                    <IconX />
                  </button>
                </div>
              ))}
            </div>

            {/* Botão finalizar dentro do resumo também */}
            <div
              className="px-4 pb-4 pt-2 flex gap-2"
            >
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="btn-primary flex-1 justify-center gap-2 text-xs"
                style={{ padding: "0.625rem 1rem" }}
              >
                <IconWhatsApp />
                {finishing ? "Preparando…" : "Finalizar e mandar no WhatsApp"}
              </button>
              {data === null && (
                <button
                  onClick={() => setUrl("")}
                  className="btn-ghost text-xs gap-1.5"
                >
                  <IconPlus /> Nova música
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Criar Medley ── */}
      {medleyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <div
            className="w-full max-w-3xl rounded-xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                {medleyStep === "links" ? "Criar Medley · Passo 1" : "Criar Medley · Passo 2"}
              </h3>
              <button onClick={closeMedleyBuilder} className="btn-icon" aria-label="Fechar">
                <IconX />
              </button>
            </div>

            {medleyStep === "links" && (
              <div className="p-4 space-y-3">
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Adicione os links do YouTube e arraste para ajustar a ordem do medley.
                </p>
                <Reorder.Group
                  axis="y"
                  values={medleyLinks}
                  onReorder={setMedleyLinks}
                  className="space-y-2"
                >
                  {medleyLinks.map((item, index) => (
                    <Reorder.Item
                      key={item.id}
                      value={item}
                      className="rounded-lg"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: "0.625rem" }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--foreground-subtle)" }}>
                          <IconGrab />
                        </span>
                        <span className="text-xs w-4 text-center" style={{ color: "var(--foreground-subtle)" }}>
                          {index + 1}
                        </span>
                        <input
                          type="url"
                          value={item.url}
                          onChange={(e) => {
                            setMedleyLinks((prev) =>
                              prev.map((link) => (link.id === item.id ? { ...link, url: e.target.value } : link))
                            );
                          }}
                          placeholder="https://youtube.com/watch?v=..."
                          className="field-input flex-1"
                        />
                        <button
                          onClick={() => removeMedleyLink(item.id)}
                          className="btn-icon shrink-0"
                          aria-label="Remover link"
                        >
                          <IconX />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            )}

            {medleyStep === "stanzas" && (
              <div className="p-4 space-y-3">
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Arraste as estrofes para montar a ordem final do medley.
                </p>

                <Reorder.Group
                  axis="y"
                  values={medleyStanzas}
                  onReorder={setMedleyStanzas}
                  className="space-y-2 max-h-[48vh] overflow-y-auto pr-1"
                >
                  {medleyStanzas.map((stanza) => (
                    <Reorder.Item
                      key={stanza.id}
                      value={stanza}
                      className="rounded-lg cursor-grab active:cursor-grabbing"
                      style={{
                        background: activeMedleyStanza === stanza.id ? "var(--surface-3)" : "var(--surface-2)",
                        border: `1px solid ${activeMedleyStanza === stanza.id ? "var(--border-hover)" : "var(--border)"}`,
                        padding: "0.75rem",
                      }}
                      onClick={() => setActiveMedleyStanza(activeMedleyStanza === stanza.id ? null : stanza.id)}
                    >
                      <div className="flex items-start gap-2">
                        <span style={{ color: "var(--foreground-subtle)", marginTop: "2px", flexShrink: 0 }}>
                          <IconGrab />
                        </span>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap flex-1" style={{ color: "var(--foreground-muted)" }}>
                          {stanza.text}
                        </p>
                      </div>
                      {activeMedleyStanza === stanza.id && (
                        <div className="flex flex-wrap gap-2 mt-3 ml-5">
                          <button
                            onClick={(e) => { e.stopPropagation(); duplicateMedleyStanza(stanza.id); }}
                            className="btn-ghost text-xs py-1 px-2.5"
                          >
                            Duplicar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); editMedleyStanza(stanza.id); }}
                            className="btn-ghost text-xs py-1 px-2.5"
                          >
                            Editar texto
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); mergeMedleyWithNext(stanza.id); }}
                            className="btn-ghost text-xs py-1 px-2.5"
                          >
                            Mesclar próxima
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMedleyStanza(stanza.id); }}
                            className="btn-ghost text-xs py-1 px-2.5"
                            style={{ color: "var(--destructive)", borderColor: "var(--destructive-border)" }}
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            )}

            <div className="px-5 py-3 flex items-center justify-between gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              {medleyStep === "links" ? (
                <>
                  <button onClick={addMedleyLink} className="btn-ghost text-xs gap-1.5">
                    <IconPlus /> Adicionar link
                  </button>
                  <div className="flex gap-2">
                    <button onClick={closeMedleyBuilder} className="btn-ghost text-xs">Cancelar</button>
                    <button onClick={handleMedleyNextStep} className="btn-primary text-xs" disabled={medleyLoading}>
                      {medleyLoading ? "Montando..." : "Próximo passo"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setMedleyStep("links")} className="btn-ghost text-xs">Voltar</button>
                  <div className="flex gap-2">
                    <button onClick={closeMedleyBuilder} className="btn-ghost text-xs">Cancelar</button>
                    <button onClick={handleAddMedleyToRepertoire} className="btn-primary text-xs gap-1.5">
                      <IconCheck /> Adicionar medley ao repertório
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
