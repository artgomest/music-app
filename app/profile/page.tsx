"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

interface SongPlay {
  song: { title: string; artist: string };
  playedAt: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  instruments: string;
  notes: string;
  playsThisMonth: number;
  songPlays: SongPlay[];
}

const MOCK_CHART = [30, 55, 40, 70, 60, 90, 80];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"];

const MOCK_NOTES = [
  {
    title: "Everlasting Light",
    key: "C&D",
    body: '"Keep the delay mix at 40% for the bridge. Use the swell pedal gently on the transition."',
  },
  {
    title: "Wilderness Path",
    key: "A&B",
    body: '"Syncopated picking pattern in verse 2. Watch for the tempo drop at the end."',
  },
  {
    title: "The Anchor",
    key: "G",
    body: '"Distortion kicks in at the 3rd chorus only. Mute strings during the spoken word section."',
  },
];

const MOCK_ACTIVITY = [
  { icon: "🎵", text: "Performed at Morning Grace Service", sub: "Main Act • Oct 26, 2025" },
  { icon: "📝", text: "Updated arrangement for 'Mountain High'", sub: "Arrangement Last • Oct 23, 2025" },
  { icon: "📥", text: "Imported 4 new reference tracks", sub: "Support Admin • Oct 15, 2025" },
];

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", instruments: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        setForm({ 
          name: data.name ?? "", 
          instruments: data.instruments ?? "", 
          notes: data.notes ?? "" 
        });
      })
      .catch(err => console.error(err));
  }, [status]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      const updated = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64" style={{ color: "var(--muted-foreground)" }}>
          Loading...
        </div>
      </AppShell>
    );
  }

  const roleLabel =
    profile.role === "leader" ? "Líder" : "Músico";
  const maxChart = Math.max(...MOCK_CHART);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ── Hero ── */}
        <div
          className="sanctuary-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
        >
          {/* Avatar */}
          <div
            className="relative shrink-0"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: "linear-gradient(135deg, #2D3A8C 0%, #5B6DD4 100%)",
                boxShadow: "0 4px 16px rgba(45,58,140,0.25)",
              }}
            >
              🎸
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex gap-2 mb-2">
              <span className="badge">{roleLabel.toUpperCase()} GUITARIST</span>
              <span className="badge badge-amber">COMPOSER</span>
            </div>
            {/* Name */}
            {editing ? (
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field-input text-3xl font-bold mb-1 py-1"
                style={{ fontFamily: "var(--font-sans)" }}
              />
            ) : (
              <h1
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
              >
                {profile.name}
              </h1>
            )}
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {profile.instruments ||
                "Curating sonic landscapes for morning services. Focused on ambient textures and melodic clarity."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(!editing)}
              className="btn-ghost text-sm"
              style={{ padding: "0.5rem 0.75rem" }}
            >
              {editing ? "✕ Cancel" : "✏️ Edit"}
            </button>
            <button className="btn-ghost text-sm" style={{ padding: "0.5rem 0.75rem" }}>
              ↗
            </button>
          </div>
        </div>

        {/* ── Edit form ── */}
        {editing && (
          <form onSubmit={saveProfile} className="sanctuary-card p-6 space-y-4 animate-fade-up">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
              Edit Profile
            </h3>
            <div>
              <label className="section-label block mb-1">Instruments</label>
              <input
                value={form.instruments}
                onChange={(e) => setForm({ ...form, instruments: e.target.value })}
                placeholder="e.g. Guitarra, Teclado, Bateria"
                className="field-input"
              />
            </div>
            <div>
              <label className="section-label block mb-1">Bio / Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="field-input"
                style={{ resize: "none" }}
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Contributions", value: profile.songPlays?.length?.toString().padStart(4, "0") || "0000" },
            { label: "This Month", value: profile.playsThisMonth || 0 },
            { label: "Current Mastery", value: "Senior" },
            { label: "Instruments", value: profile.instruments ? profile.instruments.split(",").length : 0 },
          ].map((s) => (
            <div key={s.label} className="sanctuary-card p-4">
              <p className="section-label mb-1">{s.label.toUpperCase()}</p>
              <p
                className="text-2xl font-bold"
                style={{
                  fontFamily: typeof s.value === "string" && isNaN(Number(s.value)) ? "var(--font-serif)" : undefined,
                  color: "var(--foreground)",
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Participation Chart ── */}
        <div className="sanctuary-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
              Participation History
            </h2>
            <span className="badge">Last 6 months</span>
          </div>
          <div className="flex items-end gap-3 h-28">
            {MOCK_CHART.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${(v / maxChart) * 100}%`,
                    background:
                      i === MOCK_CHART.length - 1
                        ? "var(--primary)"
                        : "var(--accent)",
                    minHeight: "4px",
                  }}
                />
                <span className="section-label" style={{ fontSize: "0.55rem" }}>
                  {MONTHS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Personal Song Notes ── */}
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            Personal Song Notes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MOCK_NOTES.map((note) => (
              <div key={note.title} className="sanctuary-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                    {note.title}
                  </h3>
                  <span className="badge badge-amber">{note.key}</span>
                </div>
                <p
                  className="text-xs italic leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {note.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
              Recent Activity
            </h2>
            <button
              className="text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              View All Archive
            </button>
          </div>
          <div className="sanctuary-card divide-y" style={{ borderColor: "var(--border)" }}>
            {(profile.songPlays && profile.songPlays.length > 0
              ? profile.songPlays.slice(0, 3).map((p) => ({
                  icon: "🎵",
                  text: `Performed: ${p.song.title}`,
                  sub: `${p.song.artist} • ${new Date(p.playedAt).toLocaleDateString("pt-BR")}`,
                }))
              : MOCK_ACTIVITY
            ).map((act, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {act.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {act.text}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {act.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
