import type { Metadata, Viewport } from "next";
import { Epilogue, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font — no request to Google from the shopper's phone.
const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-epilogue",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Caidea — Original and compatible phone screens in Pakistan",
    template: "%s | Caidea",
  },
  description:
    "OLED, AMOLED and LCD replacement display assemblies for Samsung, Apple, Xiaomi, Oppo, Vivo, Infinix and Tecno, delivered across Pakistan.",
};

export const viewport: Viewport = {
  themeColor: "#0B1C33",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PK" className={`${epilogue.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh bg-canvas font-sans text-midnight antialiased">{children}</body>
    </html>
  );
}
