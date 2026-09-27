import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "DealDost — know your rate, spot fake brands",
  description: "Free tools for Indian creators: find a fair price for brand deals and check if a brand offer is real.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <Header />
        <main className="mx-auto max-w-3xl px-5 pb-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
