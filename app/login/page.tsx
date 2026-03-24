"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
          Welcome back
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          Please enter your details to find your peace.
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
            <label className="section-label block mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="section-label block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="field-input"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2 py-3"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted-foreground)" }}>
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Create an account
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div
        className="flex gap-4 mt-8 text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        {["Privacy", "Terms", "Support"].map((l) => (
          <span
            key={l}
            className="cursor-pointer hover:underline uppercase tracking-widest"
            style={{ fontSize: "0.6rem" }}
          >
            {l}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.6rem" }}>
        © 2024 THE SANCTUARY. ALL RIGHTS RESERVED.
      </p>
    </main>
  );
}
