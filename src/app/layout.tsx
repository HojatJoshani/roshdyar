import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/components/app-providers";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "رشدیار | پلتفرم رشد اینستاگرام و یوتیوب",
  description:
    "رشدیار، بازارگاه هوشمند خدمات رشد اینستاگرام و یوتیوب با کیفیت واقعی، تحویل شفاف و پشتیبانی صادقانه. خرید دنبال‌کننده، لایک و بازدید با کیفیتی که می‌فهمی.",
  keywords: [
    "خرید فالوور اینستاگرام",
    "خرید لایک اینستاگرام",
    "خرید بازدید یوتیوب",
    "پنل رشد اینستاگرام",
    "رشدیار",
  ],
  authors: [{ name: "Roshdyar" }],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>{children}</AppProviders>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
