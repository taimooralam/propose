import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Propose — AI Proposal Intelligence",
  description: "Slot-based retrieval system for hotel event proposals. Extracts requirements from RFPs, matches products, verifies coverage, and assembles proposals.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  )
}
