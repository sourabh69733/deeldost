import { SITE } from "@/lib/site";

// Shared layout for the privacy and terms pages.
export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="max-w-2xl pt-6 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="text-4xl font-extrabold">{title}</h1>
      <p className="hint">Last updated: {SITE.legalUpdated}</p>
      {children}
      <h2>Contact</h2>
      <p>
        {SITE.contactEmail
          ? <>Questions or requests: <a className="underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</>
          : <>A contact email will be listed here before public launch.</>}
      </p>
    </article>
  );
}
