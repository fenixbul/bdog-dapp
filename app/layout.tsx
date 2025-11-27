import "./global.css";

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Footer, Header } from "../components/layout";
import { Toaster } from "@/components/ui";
import { TooltipProvider } from "@/components/ui";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
})
 
export const metadata: Metadata = {
  title: '$BDOG - BOB\’s best friend',
  description: 'BOBDOG ($BDOG)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/images/favicon/site.webmanifest" />
        <link rel="shortcut icon" href="/images/favicon/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function setViewportHeight() {
                // Get the actual viewport height
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
                
                // Also set a full viewport height variable
                document.documentElement.style.setProperty('--full-vh', window.innerHeight + 'px');
              }
              
              // Initial call
              setViewportHeight();
              
              // Listen for resize events (includes address bar show/hide)
              let resizeTimer;
              window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(setViewportHeight, 100);
              });
              
              // Listen for orientation changes
              window.addEventListener('orientationchange', function() {
                setTimeout(setViewportHeight, 200);
              });
              
              // Listen for scroll events to detect address bar changes on mobile
              let lastScrollY = 0;
              let scrollTimer;
              window.addEventListener('scroll', function() {
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(function() {
                  if (Math.abs(window.scrollY - lastScrollY) < 50) {
                    setViewportHeight();
                  }
                  lastScrollY = window.scrollY;
                }, 150);
              }, { passive: true });
              
              // Visual viewport API support for better mobile handling
              if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', setViewportHeight);
              }
            `,
          }}
        />
      </head>
      <body className="bg-background">
        <TooltipProvider>
          <AuthProvider>
            {/* <Header /> */}
            {children}
            {/* <Footer /> */}
            {/* <Toaster /> */}
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
