import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ClosetShare.in",
    template: "%s | ClosetShare.in",
  },
  description: "Your shared closet in the Cloud",
  keywords: ["fashion rental", "closet sharing", "outfit rental", "peer-to-peer fashion"],
  authors: [{ name: "ClosetShare.in" }],
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://closetshare.in",
    title: "ClosetShare.in",
    description: "Your shared closet in the Cloud",
    siteName: "ClosetShare.in",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "ClosetShare.in - Your shared closet in the Cloud",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClosetShare.in",
    description: "Your shared closet in the Cloud",
    images: ["/logo.jpg"],
  },
  metadataBase: new URL("https://closetshare.in"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
