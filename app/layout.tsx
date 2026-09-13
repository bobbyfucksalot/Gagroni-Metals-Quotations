import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { 
  title: "Gagroni Metals Quotation Maker", 
  description: "Enterprise Quotation Workspace for Gagroni Metals",
  icons: {
    icon: [
      { url: '/gagroni-metals-logo.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/gagroni-metals-logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
