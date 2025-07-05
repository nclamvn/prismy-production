import type { Metadata } from "next";

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
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}