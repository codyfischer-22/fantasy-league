import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import SiteFrame from "@/components/SiteFrame";
import PardonOurMessModal from "@/components/PardonOurMessModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trekkon Fantasy Leagues",
  description: "Gather Buddies. Draft Teams. Make History.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Trekkon Fantasy Leagues",
    description: "Gather Buddies. Draft Teams. Make History.",
    siteName: "Trekkon Fantasy Leagues",
    images: [
      {
        url: "https://trekkonleagues.com/og-image.png",
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
    description: "Gather Buddies. Draft Teams. Make History.",
    images: ["https://trekkonleagues.com/og-image.png"],
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
    <PardonOurMessModal />
    <SiteFrame>{children}</SiteFrame>
  </AuthProvider>
</body>

    </html>
  );
}