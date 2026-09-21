import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TalkShit — Your group chat is boring. Fix it.",
  description:
    "Turn awkward silence into arguments, challenges and chaos. A private multiplayer social game for friend groups.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-[#09090b] text-zinc-50 antialiased no-x-scroll">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-10 pt-6 sm:max-w-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
