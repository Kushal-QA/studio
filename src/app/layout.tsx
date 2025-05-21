
import type {Metadata} from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/gtag';
import { NavigationEvents } from '@/components/NavigationEvents';
import { Suspense } from 'react';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CalorieWise - Smart Calorie Calculator',
  description: 'Calculate your daily calorie needs and get a personalized Indian meal plan with CalorieWise.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {GA_TRACKING_ID && (
          <>
            {/* Google Analytics Scripts */}
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${poppins.variable} ${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
        {/* Component to track page changes */}
        {GA_TRACKING_ID && (
          <Suspense fallback={null}>
            <NavigationEvents />
          </Suspense>
        )}
      </body>
    </html>
  );
}
