import type { Metadata } from "next";
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
  openGraph: {
    title: "Trekkon Fantasy Leagues",
    description: "Choose Fandoms. Draft Teams. Beat Buddies.",
    siteName: "Trekkon Fantasy Leagues",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trekkon Fantasy Leagues",
    description: "Choose Fandoms. Draft Teams. Beat Buddies.",
  },
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