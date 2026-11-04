import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import SiteFrame from "@/components/SiteFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trekkonleagues.com"),
  title: "Trekkon Fantasy Leagues",
  description: "Choose Fandoms. Draft Teams. Beat Buddies.",
  appleWebApp: {
    capable: true,
    title: "Trekkon",
    statusBarStyle: "black",
  },
  openGraph: {
    title: "Trekkon Fantasy Leagues",
    description: "Choose Fandoms. Draft Teams. Beat Buddies.",
    siteName: "Trekkon Fantasy Leagues",
        images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trekkon Fantasy Leagues",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trekkon Fantasy Leagues",
    description: "Choose Fandoms. Draft Teams. Beat Buddies.",
        images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#12121a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SiteFrame>{children}</SiteFrame>
        </AuthProvider>
      </body>
    </html>
  );
}