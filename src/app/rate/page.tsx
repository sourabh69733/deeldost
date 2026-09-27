import RateCalculator from "@/components/RateCalculator";
import { getMyInstagramNumbers } from "@/lib/instagram/numbers";

export const metadata = { title: "What should I charge? — DealDost" };

export default async function RatePage() {
  const instagram = await getMyInstagramNumbers();
  return (
    <>
      <h1 className="pt-6 text-4xl font-extrabold">What should I charge?</h1>
      <p className="mt-3 mb-10 max-w-xl" style={{ color: "var(--muted)" }}>
        Brands pay for views, not followers. Enter your real numbers for an honest range.
      </p>
      <RateCalculator instagram={instagram} />
    </>
  );
}
