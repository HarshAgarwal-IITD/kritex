import { afterEach, describe, expect, it, vi } from "vitest";

const photo = "https://assets.example.com/products/jacket/jacket-1.webp?v=2";

async function load(resize: string | undefined) {
  vi.resetModules();
  vi.stubEnv("VITE_ASSET_BASE_URL", "https://assets.example.com");
  vi.stubEnv("VITE_IMAGE_RESIZE", resize ?? "");
  return import("./image");
}

afterEach(() => vi.unstubAllEnvs());

describe("resized images", () => {
  it("returns URLs unchanged when resizing is off", async () => {
    const { resized, srcSet } = await load("off");
    expect(resized(photo, 96)).toBe(photo);
    expect(srcSet(photo)).toBeUndefined();
  });

  it("routes object-store photos through Cloudflare transformations by default", async () => {
    const { resized, srcSet } = await load(undefined);
    expect(resized(photo, 96)).toBe(
      "https://assets.example.com/cdn-cgi/image/width=96,fit=scale-down,quality=80,format=auto/products/jacket/jacket-1.webp?v=2",
    );
    expect(srcSet(photo)?.split(", ")).toHaveLength(4);
    expect(srcSet(photo)).toContain("/cdn-cgi/image/width=480,");
  });

  it("leaves other origins and local paths alone", async () => {
    const { resized } = await load("cloudflare");
    expect(resized("https://elsewhere.com/a.webp", 96)).toBe("https://elsewhere.com/a.webp");
    expect(resized("/assets/logo.webp", 96)).toBe("/assets/logo.webp");
  });
});
