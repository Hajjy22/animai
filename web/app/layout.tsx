import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AnimAI — production-safe 3D & motion for AI agents",
    template: "%s — AnimAI",
  },
  description:
    "Vetted, memory-leak-free, SSR-safe React Three Fiber & GSAP components, delivered through a CLI and MCP server.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://animai.dev"),
  openGraph: {
    type: "website",
    siteName: "AnimAI",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-slate-800/80">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="inline-block h-3 w-3 rounded-full bg-sky-400" />
              AnimAI
            </Link>
            <div className="flex items-center gap-6 text-sm text-slate-300">
              <Link href="/" className="hover:text-white">
                Components
              </Link>
              <Link href="/pricing" className="hover:text-white">
                Pricing
              </Link>
              <Link href="/playground" className="hover:text-white">
                Playground
              </Link>
              <Link href="/docs" className="hover:text-white">
                Docs
              </Link>
              <a
                href="https://www.npmjs.com/package/animai"
                className="rounded-md bg-sky-500 px-3 py-1.5 font-medium text-slate-950 hover:bg-sky-400"
              >
                npx animai
              </a>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
        <footer className="border-t border-slate-800/80 py-8 text-center text-sm text-slate-500">
          Every component is certified by the AnimAI vetting harness.
        </footer>
      </body>
    </html>
  );
}
