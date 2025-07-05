import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SkipToMain } from "@/components/accessibility";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prismy v2 - Document Translation Platform",
  description: "Professional document translation with OCR and AI - Production Ready",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <SkipToMain />
        <ThemeProvider>
          <main id="main-content">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}