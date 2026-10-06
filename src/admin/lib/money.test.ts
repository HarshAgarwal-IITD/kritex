import { describe, expect, it } from "vitest";
import { formatPaise, paiseToRupees, rupeesToPaise } from "./money";

describe("money helpers", () => {
  it("converts rupee input to integer paise without float error", () => {
    expect(rupeesToPaise("1299")).toBe(129900);
    expect(rupeesToPaise("1299.5")).toBe(129950);
    expect(rupeesToPaise("0.29")).toBe(29);
    expect(rupeesToPaise("1,19,999.99")).toBe(11999999);
    expect(rupeesToPaise(" ")).toBeNull();
    expect(() => rupeesToPaise("1.234")).toThrow();
  });

  it("renders paise back to an editable rupee string", () => {
    expect(paiseToRupees(129900)).toBe("1299");
    expect(paiseToRupees(129905)).toBe("1299.05");
    expect(paiseToRupees(null)).toBe("");
  });

  it("formats INR for display", () => {
    expect(formatPaise(129900)).toBe("₹1,299.00");
    expect(formatPaise(null)).toBe("—");
  });
});
