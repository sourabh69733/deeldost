import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <>
      <section className="pt-10 pb-14">
        <h1 className="text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl">
          A brand just messaged you. What do you say?
        </h1>
        <p className="mt-5 max-w-xl text-lg" style={{ color: "var(--muted)" }}>
          Find out what to charge and whether the offer is real, before you reply. Free, built for Indian creators.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/rate" className="btn">Calculate my rate</Link>
          <Link href="/check" className="btn btn-ghost">Check a brand</Link>
        </div>
      </section>

      <section className="border-t py-10" style={{ borderColor: "var(--line)" }}>
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-5 space-y-4">
          <li><strong>Enter your numbers.</strong> Followers, average views, niche. Views matter more than followers.</li>
          <li><strong>Get a fair price range.</strong> A low, fair and high number in rupees, plus a rate card you can copy.</li>
          <li><strong>Paste the brand&apos;s message.</strong> We look for scam signals and tell you what to ask before saying yes.</li>
        </ol>
      </section>

      <section className="border-t py-10" style={{ borderColor: "var(--line)" }}>
        <h2 className="text-2xl font-bold">Coming next: every brand offer in one place</h2>
        <p className="mt-3 max-w-xl" style={{ color: "var(--muted)" }}>
          Connect your email and we&apos;ll pull out brand deals, flag scams, and remind you when a brand is late to pay.
        </p>
        <div className="mt-5"><WaitlistForm /></div>
      </section>
    </>
  );
}
