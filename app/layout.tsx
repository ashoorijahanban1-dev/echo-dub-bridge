import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "RPIM TV — تلویزیون تخصصی آموزش‌های دوبله فارسی هوش مصنوعی",
  description: "آموزش‌های تخصصی برنامه‌نویسی، داکر، کوبرنتیز و هوش مصنوعی به زبان فارسی با صدای طبیعی هوش مصنوعی و پخش بدون نیاز به فیلترشکن در RPIM TV.",
  keywords: ["آموزش برنامه‌نویسی", "دوبله هوش مصنوعی", "آموزش داکر", "RPIM TV", "تلویزیون RPIM", "استریم ویدیو"],
  openGraph: {
    title: "RPIM TV — آموزش‌های تخصصی با دوبله فارسی هوش مصنوعی",
    description: "تلویزیون تخصصی تماشای ویدیوهای آموزشی با دوبله هوش مصنوعی",
    type: "website",
    locale: "fa_IR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className="bg-[#080B11] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
        {/* Top ambient glow circles */}
        <div className="ambient-glow bg-cyan-600/20 top-0 right-1/4 w-96 h-96" />
        <div className="ambient-glow bg-violet-600/20 top-20 left-1/4 w-96 h-96" />

        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
