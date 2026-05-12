import "./globals.css";
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { GeistSans } from 'geist/font'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Code Innovation Festival — Inter-School Tech Competition',
  description:
    'Join the Code Innovation Festival by Code Innovators Academy — an inter-school tech competition for students in Mombasa, Kenya. September 27, 2025.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// Clash Display for titles and hero
const clashDisplay = localFont({
  src: [
    {
      path: './fonts/clash/ClashDisplay-Extralight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './fonts/clash/ClashDisplay-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/clash/ClashDisplay-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/clash/ClashDisplay-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/clash/ClashDisplay-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/clash/ClashDisplay-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-clash-display',
  display: 'swap',
})

// JetBrains Mono for countdown, tags, badges
const jetbrainsMono = localFont({
  src: [
    {
      path: './fonts/jetbrains/JetBrainsMono-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-ThinItalic.woff2',
      weight: '100',
      style: 'italic',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-ExtraLightItalic.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-SemiBoldItalic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/jetbrains/JetBrainsMono-ExtraBoldItalic.woff2',
      weight: '800',
      style: 'italic',
    },
  ],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(GeistSans.variable, clashDisplay.variable, jetbrainsMono.variable, "font-sans", geist.variable, "dark")} suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground" suppressHydrationWarning>{children}</body>
    </html>
  )
}