import type { Metadata } from "next";
import { cookies } from 'next/headers';
import "./globals.css";

export const metadata: Metadata = {
  title: "Prismy v2 - Document Translation Platform",
  description: "Professional document translation with OCR and AI - Production Ready",
};

function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = document.cookie.match(/prismy-theme=(\\w+)/)?.[1] || 'light';
              // Remove any existing theme classes first
              document.documentElement.classList.remove('light', 'dark');
              // Add the current theme
              document.documentElement.classList.add(theme);
              document.documentElement.style.colorScheme = theme;
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get theme from cookies for SSR
  const cookieStore = cookies();
  const theme = cookieStore.get('prismy-theme')?.value || 'light';

  return (
    <html lang="vi" className={theme} style={{ colorScheme: theme }}>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}