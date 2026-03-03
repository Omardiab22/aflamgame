import type { Metadata } from "next"
import "./globals.css"
import { Cairo, Inter } from "next/font/google"

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  weight: ["400", "600", "700"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Aflam Game",
  description: "Live movie quiz",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: "var(--font-cairo), var(--font-inter), system-ui, sans-serif" }}
      >
        <div className="bg-cinema" />
        {children}
      </body>
    </html>
  )
}