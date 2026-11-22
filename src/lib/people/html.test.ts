import { describe, expect, it } from "vitest";
import { decodeEntities, readHtml } from "./html";

const PAGE = `<!doctype html><html><head>
<title>Riya &amp; Chai | Linktree</title>
<meta property="og:description" content="Food &amp; travel creator from Jaipur">
<style>.x{color:red}</style><script>var secret = "riya@hidden.com";</script>
</head><body>
<h1>Riya Sharma</h1><p>Collabs: <a href="mailto:riya@mail.com">email me</a></p>
<a href="/shop">Shop</a><a href="https://instagram.com/riya">Instagram</a><a href="#top">Top</a>
<!-- comment --><div>Cafés&nbsp;in Jaipur &#x2615;</div>
</body></html>`;

describe("readHtml", () => {
  const info = readHtml(PAGE, "https://linktr.ee/riya");

  it("reads title and description", () => {
    expect(info.title).toBe("Riya & Chai | Linktree");
    expect(info.description).toBe("Food & travel creator from Jaipur");
  });

  it("keeps visible text, drops scripts and styles", () => {
    expect(info.text).toContain("Riya Sharma");
    expect(info.text).toContain("Cafés in Jaipur ☕");
    expect(info.text).not.toContain("hidden");
    expect(info.text).not.toContain("color:red");
  });

  it("resolves links and skips #anchors", () => {
    expect(info.links).toEqual(["mailto:riya@mail.com", "https://linktr.ee/shop", "https://instagram.com/riya"]);
  });

  it("caps text length", () => {
    expect(readHtml(`<p>${"a".repeat(100)}</p>`, "https://x.in", 10).text).toHaveLength(10);
  });
});

describe("decodeEntities", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeEntities("a &amp; b &#39;c&#39; &#x1F600; &bogus;")).toBe("a & b 'c' 😀 &bogus;");
  });
});
