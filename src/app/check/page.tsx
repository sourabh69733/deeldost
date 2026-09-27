import BrandChecker from "@/components/BrandChecker";
import { getMyInstagramNumbers } from "@/lib/instagram/numbers";

export const metadata = { title: "Is this brand real? — DealDost" };

export default async function CheckPage() {
  const instagram = await getMyInstagramNumbers();
  return (
    <>
      <h1 className="pt-6 text-4xl font-extrabold">Is this brand offer real?</h1>
      <p className="mt-3 mb-10 max-w-xl" style={{ color: "var(--muted)" }}>
        Paste what they sent you. We check for common scam signals and tell you what to ask.
      </p>
      <BrandChecker instagram={instagram} />
    </>
  );
}
