import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Terms — DealDost" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>By using DealDost you agree to these terms. If you don&apos;t agree, please don&apos;t use the site.</p>

      <h2>What DealDost gives you</h2>
      <ul>
        <li><strong>Prices are estimates.</strong> Your real rate depends on your audience, content and the brand.</li>
        <li><strong>Brand checks show signals, not proof.</strong> A &quot;looks OK&quot; result doesn&apos;t guarantee a brand is genuine, and a warning doesn&apos;t prove it is a scam.</li>
        <li>Nothing on DealDost is legal, financial or tax advice. You make your own decisions about any deal.</li>
      </ul>

      <h2>Using the site fairly</h2>
      <ul>
        <li>Only upload messages and screenshots you received and are allowed to share.</li>
        <li>Don&apos;t misuse the site: no automated scraping, attacks, or attempts to get around usage limits.</li>
        <li>We may limit how often you use a tool so it stays free and working for everyone.</li>
      </ul>

      <h2>No guarantees</h2>
      <p>
        DealDost is provided &quot;as is&quot;. We work to keep it accurate and available but can&apos;t promise it will be error-free.
        To the extent the law allows, we are not responsible for losses from deals you make or decline based on our results.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms and will change the date at the top when we do.</p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of India.</p>
    </LegalPage>
  );
}
