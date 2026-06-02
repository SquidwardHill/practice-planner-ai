import {
  extractMainTextFromHtml,
  normalizeUrlForCache,
} from "@/lib/utils/web";

describe("normalizeUrlForCache", () => {
  it("strips hash fragments and normalizes trailing slash", () => {
    expect(
      normalizeUrlForCache("https://example.com/some-page#section-1"),
    ).toBe("https://example.com/some-page/");
  });

  it("keeps existing trailing slash", () => {
    expect(normalizeUrlForCache("https://example.com/x/?q=1")).toBe(
      "https://example.com/x/?q=1",
    );
  });
});

describe("extractMainTextFromHtml", () => {
  it("prefers article content and extracts paragraph text", () => {
    const html = `
      <html>
        <head><title>Test</title></head>
        <body>
          <header>Site header</header>
          <main>
            <p>Main paragraph that should be ignored.</p>
          </main>
          <article>
            <h1>Basketball Drills</h1>
            <p>Paragraph one.</p>
            <p>Paragraph two.</p>
            <ul><li>List item</li></ul>
          </article>
          <footer>Site footer</footer>
        </body>
      </html>
    `;

    const text = extractMainTextFromHtml(html);
    expect(text).toContain("Basketball Drills");
    expect(text).toContain("Paragraph one.");
    expect(text).toContain("Paragraph two.");
    expect(text).toContain("List item");
    expect(text).not.toContain("Main paragraph that should be ignored.");
    expect(text).not.toContain("Site header");
    expect(text).not.toContain("Site footer");
  });
});

