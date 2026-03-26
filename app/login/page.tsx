"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const IconLogo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="1" y="1" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 14V7l4 3 4-3v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Email ou senha incorretos.");
    } else {
      router.push("/");
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-3 mb-10 animate-fade-up">
        <div style={{ color: "var(--foreground-muted)" }}>
          <IconLogo />
        </div>
        <div>
          <div className="app-logo text-center">
            The <em>Sanctuary</em>
          </div>
          <p
            className="section-label text-center mt-1"
            style={{ letterSpacing: "0.12em" }}
          >
            IBF Music Hub
          </p>
        </div>
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-xs animate-fade-up"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="card" style={{ padding: "1.5rem" }}>
          <h1
            className="text-base font-semibold mb-1"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            Entrar
          </h1>
          <p className="text-xs mb-5" style={{ color: "var(--foreground-muted)" }}>
            Digite suas credenciais para continuar.
          </p>

          {error && (
            <div
              className="mb-4 px-3 py-2.5 rounded text-xs"
              style={{
                background: "var(--destructive-subtle)",
                border: "1px solid var(--destructive-border)",
                color: "var(--destructive)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                className="section-label block mb-1.5"
                htmlFor="email"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="field-input"
                required
              />
            </div>
            <div>
              <label
                className="section-label block mb-1.5"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-1"
              style={{ padding: "0.625rem 1rem" }}
            >
              {loading ? (
                <span style={{ opacity: 0.7 }}>Entrando…</span>
              ) : (
                "Continuar"
              )}
            </button>
          </form>
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: "var(--foreground-subtle)" }}
        >
          Não tem uma conta?{" "}
          <Link
            href="/register"
            className="font-medium hover:underline"
            style={{ color: "var(--foreground-muted)" }}
          >
            Criar conta
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div
        className="flex gap-5 mt-12 animate-fade-up"
        style={{ animationDelay: "0.1s" }}
      >
        {["Privacidade", "Termos", "Suporte"].map((l) => (
          <span
            key={l}
            className="cursor-pointer hover:underline section-label"
            style={{ letterSpacing: "0.06em" }}
          >
            {l}
          </span>
        ))}
      </div>
    </main>
  );
}
