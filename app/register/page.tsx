"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "musician" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    let json;
    try {
      json = await res.json();
    } catch {
      json = { error: "Falha na comunicação com o servidor." };
    }

    if (!res.ok) {
      setError(json.details ? `${json.error} (${json.details})` : json.error ?? "Erro ao criar conta.");
    } else {
      router.push("/login");
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      {/* Logo */}
      <div className="text-center mb-8 animate-fade-up">
        <div className="sanctuary-logo text-3xl mb-1">
          The <span>Sanctuary</span>
        </div>
        <p className="section-label tracking-widest">IBF MUSIC HUB</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm animate-fade-up"
        style={{
          background: "var(--card)",
          borderRadius: "1rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          padding: "2rem",
          animationDelay: "0.05s",
        }}
      >
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
          Create an account
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          Join your sanctuary music community.
        </p>

        {error && (
          <div
            className="mb-4 px-4 py-3 text-sm rounded-lg"
            style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.2)",
              color: "var(--destructive)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="section-label block mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="section-label block mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@domain.com"
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="section-label block mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••••"
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="section-label block mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="field-input"
            >
              <option value="musician">Músico</option>
              <option value="leader">Líder de Louvor</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2 py-3"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted-foreground)" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
