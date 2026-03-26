import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Letra | IBF Music Hub",
};

export default function LetraLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: "#0a0a0f" }}>
        {children}
      </body>
    </html>
  );
}
