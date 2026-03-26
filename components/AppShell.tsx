"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
}

const IconMenu = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
  </svg>
);
const IconLogout = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 8H6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const navLinks = [
  { href: "/", label: "Importar" },
  { href: "/acervo", label: "Acervo" },
  { href: "/profile", label: "Perfil" },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* ── Top nav ── */}
      <nav
        className="top-nav"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <Link href="/" className="app-logo shrink-0">
          The <em>Sanctuary</em>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 ml-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop: session actions */}
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden md:flex btn-ghost text-xs items-center gap-1.5"
            style={{ padding: "0.375rem 0.75rem" }}
          >
            <IconLogout />
            Sair
          </button>
        )}

        {/* Mobile: hamburger */}
        <button
          className="btn-icon md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <IconX /> : <IconMenu />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex flex-col p-2 gap-0.5 max-w-2xl mx-auto w-full">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-link ${pathname === l.href ? "active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
            {session && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="nav-link text-left w-full"
                style={{ color: "var(--destructive)" }}
              >
                <IconLogout />
                Sair
              </button>
            )}
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 animate-fade-up">
        {children}
      </main>
    </div>
  );
}
