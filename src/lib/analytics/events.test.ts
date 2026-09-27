import { describe, expect, it } from "vitest";
import { dayKey, viewEvent } from "./events";

describe("dayKey", () => {
  it("uses India time, so late-night UTC counts as the next day", () => {
    expect(dayKey(new Date("2026-09-26T20:00:00Z"))).toBe("2026-09-27"); // 1:30 am IST
    expect(dayKey(new Date("2026-09-26T10:00:00Z"))).toBe("2026-09-26");
  });
});

describe("viewEvent", () => {
  it.each([["/", "view_home"], ["/rate", "view_rate"], ["/check", "view_check"], ["/privacy", "view_other"]])(
    "%s -> %s", (path, event) => expect(viewEvent(path)).toBe(event),
  );
});
