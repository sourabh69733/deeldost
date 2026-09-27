import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Privacy — DealDost" };

// Keep in sync with what the code stores. See PROJECT.md "Data model".
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>
        DealDost helps creators price brand deals and spot fake offers. We collect as little as we can.
        This page explains what we use, what we keep, and your choices.
      </p>

      <h2>Rate calculator</h2>
      <p>
        The calculator runs in your browser. Your followers, views and niche are saved only on your device
        so you don&apos;t have to type them again. They are not sent to us unless you use them in a brand check.
      </p>

      <h2>Brand check</h2>
      <p>To check an offer, you send us the brand&apos;s message or a screenshot, and optionally the brand&apos;s website, Instagram handle and your numbers. We use these only to produce your result.</p>
      <ul>
        <li><strong>Not stored:</strong> the message text, the screenshot, and your numbers.</li>
        <li><strong>Stored:</strong> brand name, website, Instagram handle, the risk level, which warning signs matched, whether AI was used, and the time. We use this to improve our checks.</li>
        <li>
          <strong>AI:</strong> the message or screenshot is analysed by Claude (made by Anthropic) through Google Cloud Vertex AI.
          This processing may happen outside India.
        </li>
        <li><strong>Website check:</strong> if you give a website, we visit it and look up its registration date through rdap.org.</li>
      </ul>

      <h2>Deal reports</h2>
      <p>
        If you tell us what a deal paid, we store the numbers from the calculator (platform, deliverable, niche, followers,
        average views, add-ons) and the amount. No name, handle or brand. We use these to make price estimates more accurate.
      </p>

      <h2>Waitlist</h2>
      <p>If you join the waitlist we store your email address, only to tell you when new features open.</p>

      <h2>Limits and security</h2>
      <p>
        To stop abuse we count checks per visitor using a scrambled (hashed) form of your IP address, never the IP itself.
        These counts delete themselves automatically, usually within a day.
      </p>

      <h2>Where data lives</h2>
      <p>Stored data is kept in Google Cloud in Mumbai, India. We don&apos;t sell your data or share it for advertising.</p>

      <h2>Cookies</h2>
      <p>We don&apos;t use tracking or advertising cookies.</p>

      <h2>Your rights</h2>
      <p>
        Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask to see, correct or delete your data,
        withdraw consent, or raise a complaint. Contact us using the email below.
      </p>

      <h2>Age</h2>
      <p>DealDost is meant for people aged 18 and over.</p>

      <h2>Changes</h2>
      <p>
        We will update this page before we add new features that use more data, such as connecting your Instagram account,
        and change the date at the top.
      </p>
    </LegalPage>
  );
}
