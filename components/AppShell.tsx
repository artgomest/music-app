"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

interface SetlistItem {
  title: string;
  key: string;
}

interface AppShellProps {
  children: React.ReactNode;
  setlist?: SetlistItem[];
  nextService?: string;
  onExportPDF?: () => void;
  onExportWhatsApp?: () => void;
}

const navLinks = [
  { href: "/", label: "Import", icon: "add_circle" },
  { href: "/acervo", label: "Acervo", icon: "library_music" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export default function AppShell({
  children,
  setlist = [],
  nextService = "Sunday",
  onExportWhatsApp,
}: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarLinks = [
    {
      icon: "🎵",
      label: "Current Setlist",
      active: setlist.length > 0,
    },
    { icon: "🕐", label: "Recent Imports", active: false },
    { icon: "⭐", label: "Favorites", active: false },
  ];

  return (
    <div className="app-shell">
      {/* ── Left sidebar ── */}
      <aside className="app-sidebar-left">
        {/* Logo */}
        <div className="sanctuary-logo mb-8 pl-1">
          The <span>Sanctuary</span>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1 mb-6">
          <p className="section-label pl-1">Navigation</p>
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{l.label === "Import" ? "📥" : l.label === "Acervo" ? "🎵" : l.label === "Profile" ? "👤" : "📅"}</span>
                {l.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Sign out */}
        {session && (
          <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn-ghost w-full text-xs justify-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="app-main flex flex-col">
        {/* Top nav */}
        <nav className="top-nav">
          {/* Mobile: logo */}
          <div className="sanctuary-logo lg:hidden flex-1">
            The <span>Sanctuary</span>
          </div>

          <div className="hidden lg:block flex-1 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
            {pathname === "/" ? "Music Import" : pathname === "/acervo" ? "Library" : pathname === "/profile" ? "User Profile" : "Dashboard"}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <span
              className="text-xl cursor-pointer"
              style={{ color: "var(--muted-foreground)" }}
            >
              🔔
            </span>
            <span
              className="text-xl cursor-pointer"
              style={{ color: "var(--muted-foreground)" }}
            >
              ⚙️
            </span>
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: "var(--muted-foreground)" }}
            >
              ☰
            </button>
          </div>
        </nav>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden border-b"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex flex-col p-2 gap-0.5">
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
                  Sair
                </button>
              )}
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 p-6 lg:p-8 animate-fade-up">{children}</div>
      </div>

      {/* ── Right sidebar ── */}
      <aside className="app-sidebar-right">
        <div className="mb-4">
          <p className="section-label pl-1">Repertoire Summary</p>
          <div className="setlist-item cursor-pointer mb-1">
            <span>🎵</span>
            <span className="text-sm font-medium">Current Setlist</span>
          </div>
          <div className="setlist-item cursor-pointer mb-1" style={{ color: "var(--muted-foreground)" }}>
            <span>🕐</span>
            <span className="text-sm">Recent Imports</span>
          </div>
          <div className="setlist-item cursor-pointer" style={{ color: "var(--muted-foreground)" }}>
            <span>⭐</span>
            <span className="text-sm">Favorites</span>
          </div>
        </div>

        {/* Setlist items */}
        {setlist.length > 0 && (
          <div className="flex-1 mt-2">
            <p className="section-label mb-2 pl-1">Items ({setlist.length})</p>
            <div className="space-y-1">
              {setlist.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg"
                  style={{ background: "var(--background)" }}
                >
                  <span
                    className="text-xs w-4"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.title}</p>
                  </div>
                  <span className="badge text-[10px]">{item.key}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export button */}
        {onExportWhatsApp && setlist.length > 0 && (
          <button
            onClick={onExportWhatsApp}
            className="btn-primary w-full justify-center text-xs py-2.5 mt-4"
          >
            Export to WhatsApp
          </button>
        )}
      </aside>
    </div>
  );
}
