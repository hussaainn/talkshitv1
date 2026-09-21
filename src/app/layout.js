import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "TalkShit — Your group chat is boring. Fix it.",
  description:
    "Turn awkward silence into arguments, chaos and verdicts. A private multiplayer game with a feral AI referee.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#08080d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} h-full`}>
      <body className="min-h-full antialiased">
        <div className="bg-arena" />
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-5 sm:max-w-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
