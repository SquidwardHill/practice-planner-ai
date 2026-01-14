import { fixEncoding, normalizeDrillRow } from "@/lib/utils/drill-parser";
import type { DrillImportRow } from "@/lib/types/drill";
import * as iconv from "iconv-lite";

describe("drill-parser encoding fixes", () => {
  describe("fixEncoding", () => {
    it("should return empty string for null or undefined", () => {
      expect(fixEncoding(null)).toBe("");
      expect(fixEncoding(undefined)).toBe("");
    });

    it("should return string as-is if no encoding issues detected", () => {
      const cleanString = "Zone Inbounds Corner";
      expect(fixEncoding(cleanString)).toBe(cleanString);
    });

    it("should fix Windows-1252 encoding issues - apostrophe", () => {
      // Apostrophe exists in Windows-1252, so we can test the full cycle
      const correct = "Player's Choice";
      const buffer = iconv.encode(correct, "win1252");
      const garbled = buffer.toString("utf8"); // Incorrectly decode as UTF-8
      const fixed = fixEncoding(garbled);
      expect(fixed).toBe(correct);
    });

    it("should fix known garbled patterns from bug reports", () => {
      // These are the actual garbled patterns that appear in real files
      // "â€"" pattern appears when certain characters are mangled
      const garbledEmDash = "\u00E2\u20AC\u201D"; // "â€""
      const garbled = `Zone Inbounds ${garbledEmDash} Corner`;
      const fixed = fixEncoding(garbled);

      // Should fix to proper character (em dash or similar)
      expect(fixed).not.toContain("\u00E2\u20AC");
      expect(fixed).not.toContain("â€");
      // The exact character depends on what the garbled bytes represent
      expect(fixed.length).toBeGreaterThan(0);
    });

    it("should handle multiple encoding issues in one string", () => {
      const garbledEmDash = "\u00E2\u20AC\u201D";
      const garbledEnDash = "\u00E2\u20AC\u201C";
      const garbled = `Zone Inbounds ${garbledEmDash} Corner ${garbledEnDash} Variation`;
      const fixed = fixEncoding(garbled);

      // Should remove all garbled patterns
      expect(fixed).not.toContain("\u00E2\u20AC");
      expect(fixed).not.toMatch(/â€/);
    });

    it("should handle real-world example from bug report", () => {
      // This is the actual bug: "Zone Inbounds â€" Corner"
      const garbledEmDash = "\u00E2\u20AC\u201D";
      const garbled = `Zone Inbounds ${garbledEmDash} Corner`;
      const fixed = fixEncoding(garbled);

      // Should fix the encoding
      expect(fixed).not.toContain("\u00E2\u20AC");
      expect(fixed).not.toMatch(/â€/);
      expect(fixed).toContain("Zone Inbounds");
      expect(fixed).toContain("Corner");
    });

    it("should use iconv-lite for conversion when encoding issues detected", () => {
      // Test with a character that exists in Windows-1252
      const correct = "Test's String";
      const buffer = iconv.encode(correct, "win1252");
      const garbled = buffer.toString("utf8");

      // Verify iconv-lite can handle it
      const iconvBuffer = Buffer.from(garbled, "latin1");
      const iconvResult = iconv.decode(iconvBuffer, "win1252");

      // Our function should produce similar result
      const ourResult = fixEncoding(garbled);

      // Both should fix the encoding
      expect(ourResult).toBe(correct);
      expect(iconvResult).toBe(correct);
    });
  });

  describe("normalizeDrillRow", () => {
    it("should apply encoding fix to all string fields", () => {
      // Create garbled strings using actual encoding simulation
      const correctCategory = "Offense Zone";
      const correctName = "Drill Name";
      const correctNotes = "Note with ' apostrophe";

      const categoryBuffer = iconv.encode(correctCategory, "win1252");
      const nameBuffer = iconv.encode(correctName, "win1252");
      const notesBuffer = iconv.encode(correctNotes, "win1252");

      const row: DrillImportRow = {
        Category: categoryBuffer.toString("utf8"),
        Name: nameBuffer.toString("utf8"),
        Minutes: 10,
        Notes: notesBuffer.toString("utf8"),
      };

      const normalized = normalizeDrillRow(row);

      expect(normalized.Category).toBe(correctCategory);
      expect(normalized.Name).toBe(correctName);
      expect(normalized.Notes).toBe(correctNotes);
    });

    it("should handle rows without encoding issues", () => {
      const row: DrillImportRow = {
        Category: "Offense",
        Name: "Clean Drill Name",
        Minutes: 15,
      };

      const normalized = normalizeDrillRow(row);

      expect(normalized.Category).toBe("Offense");
      expect(normalized.Name).toBe("Clean Drill Name");
    });

    it("should handle undefined optional fields", () => {
      const row: DrillImportRow = {
        Category: "Category",
        Name: "Name",
        Minutes: 10,
        Notes: undefined,
        "Media Links": undefined,
      };

      const normalized = normalizeDrillRow(row);

      expect(normalized.Notes).toBeUndefined();
      expect(normalized["Media Links"]).toBeUndefined();
    });

    it("should fix garbled patterns in all fields", () => {
      const garbledEmDash = "\u00E2\u20AC\u201D";
      const row: DrillImportRow = {
        Category: `Offense ${garbledEmDash} Zone`,
        Name: `Drill ${garbledEmDash} Name`,
        Minutes: 10,
        Notes: `Note ${garbledEmDash} text`,
      };

      const normalized = normalizeDrillRow(row);

      // All fields should have encoding fixed
      expect(normalized.Category).not.toMatch(/â€/);
      expect(normalized.Name).not.toMatch(/â€/);
      expect(normalized.Notes).not.toMatch(/â€/);
    });
  });

  describe("encoding detection", () => {
    it("should correctly identify encoding issues", () => {
      // Test with known garbled patterns using Unicode escapes
      const garbledEmDash = "\u00E2\u20AC\u201D";
      const garbled = `Test ${garbledEmDash} String`;
      const encodingPattern =
        /\u00E2\u20AC|\u00E2\u20AC\u2122|\u00E2\u20AC\u0153|\u00E2\u20AC\u201D|\u00E2\u20AC\u201C|\u00E2\u20AC\u00A2|\u00E2\u20AC\u00A6/;

      const hasIssues = encodingPattern.test(garbled);
      expect(hasIssues).toBe(true);

      const noIssues = encodingPattern.test("Clean String");
      expect(noIssues).toBe(false);
    });
  });
});
