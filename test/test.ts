/// <reference path="../vite-env.d.ts" />

import { describe, it, expect } from "vitest";

import { inferModelType, loadSkinToCanvas, loadImage, isTextureSource, loadArmorToCanvas } from "../src/index.js";

import skin1_8Default from "./textures/skin-1.8-default-no_hd.png";
import skin1_8Slim from "./textures/skin-1.8-slim-no_hd.png";
import skinOldDefault from "./textures/skin-old-default-no_hd.png";
import skinLegacyHatDefault from "./textures/skin-legacyhat-default-no_hd.png";
import skin1_8SlimBlackedge from "./textures/skin-1.8-slim-no_hd-blackedge.png";
import skin1_8SlimWhiteedge from "./textures/skin-1.8-slim-no_hd-whiteedge.png";
import skin1_8Opaque from "./textures/skin-1.8_opaque-default-no_hd.png";
import armorLayer1 from "./textures/armor-layer-1.png";
import armorLayer2 from "./textures/armor-layer-2.png";

async function loadSkin(src: string) {
  const texture = await loadImage(src);
  const canvas = document.createElement("canvas");
  loadSkinToCanvas(canvas, texture);
  return canvas;
}

async function loadArmor(layer1Src: string, layer2Src: string) {
  const layer1 = await loadImage(layer1Src);
  const layer2 = await loadImage(layer2Src);
  const canvas = document.createElement("canvas");
  loadArmorToCanvas(canvas, layer1, layer2);
  return canvas;
}

describe("detect model of texture", () => {
  it("1.8 default", async () =>
    expect(inferModelType(await loadSkin(skin1_8Default))).toBe("default"));

  it("1.8 slim", async () => expect(inferModelType(await loadSkin(skin1_8Slim))).toBe("slim"));

  it("old default", async () =>
    expect(inferModelType(await loadSkin(skinOldDefault))).toBe("default"));

  it("1.8 slim blackedge", async () =>
    expect(inferModelType(await loadSkin(skin1_8SlimBlackedge))).toBe("slim"));

  it("1.8 slim whiteedge", async () =>
    expect(inferModelType(await loadSkin(skin1_8SlimWhiteedge))).toBe("slim"));
});

describe("process skin texture", () => {
  const expectTransparent = (
    canvas: HTMLCanvasElement,
    x0: number,
    y0: number,
    w: number,
    h: number,
  ) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const data = ctx!.getImageData(x0, y0, w, h).data;
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        expect(data[(y * h + x) * 4 + 3], `pixel (${x0 + x}, ${y0 + y})`).toBe(0);
      }
    }
  };

  it("clear the hat area of legacy skin", async () => {
    const canvas = await loadSkin(skinLegacyHatDefault);
    expectTransparent(canvas, 40, 0, 8 * 2, 8); // top + bottom
    expectTransparent(canvas, 32, 8, 8 * 4, 8); // right + front + left + back
  });

  it("clear the 2nd layer of opaque skin", async () => {
    const canvas = await loadSkin(skin1_8Opaque);
    expectTransparent(canvas, 40, 0, 16, 8); // HEAD2: top + bottom
    expectTransparent(canvas, 32, 8, 32, 8); // HEAD2: right + front + left + back
    expectTransparent(canvas, 0, 36, 56, 12); // RL2, BODY2, RA2: right + front + left + back
    expectTransparent(canvas, 4, 32, 8, 4); // RL2: top + bottom
    expectTransparent(canvas, 20, 32, 16, 4); // BODY2: top + bottom
    expectTransparent(canvas, 44, 32, 8, 4); // RA2: top + bottom
    expectTransparent(canvas, 0, 52, 16, 12); // LL2:right + front + left + back
    expectTransparent(canvas, 4, 48, 8, 4); // LL2: top + bottom
    expectTransparent(canvas, 48, 52, 16, 12); // LA2: right + front + left + back
    expectTransparent(canvas, 52, 48, 8, 4); // LA2: top + bottom
  });
});

describe("isTextureSource", () => {
  it("returns true for <img>", () => {
    const el = document.createElement("img");
    expect(isTextureSource(el)).toBe(true);
  });
  it("returns true for <video>", () => {
    const el = document.createElement("video");
    expect(isTextureSource(el)).toBe(true);
  });
  it("returns true for <canvas>", () => {
    const el = document.createElement("canvas");
    expect(isTextureSource(el)).toBe(true);
  });
  it("returns true for ImageBitmap", async () => {
    const bitmap = await createImageBitmap(await loadSkin(skin1_8Default));
    expect(isTextureSource(bitmap)).toBe(true);
  });
  it("returns true for OffscreenCanvas", () => {
    const canvas = new OffscreenCanvas(1, 1);
    expect(isTextureSource(canvas)).toBe(true);
  });
  it("returns false for {}", () => {
    expect(isTextureSource({})).toBe(false);
  });
  it("returns false for {src:...}", () => {
    expect(
      isTextureSource({
        src: "https://example.com/image.png",
      }),
    ).toBe(false);
  });
});

describe("process armor textures", () => {
  const expectColors = (
    canvas: HTMLCanvasElement,
    groups: {
      name: string;
      x0: number;
      y0: number;
      w: number;
      h: number;
      color: { r: number; g: number; b: number };
    }[]
  ) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    const data = ctx!.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const group = groups.find(g => x >= g.x0 && x < g.x0 + g.w && y >= g.y0 && y < g.y0 + g.h);
        const i = (y * canvas.width + x) * 4;
        const pixel = { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
        if (group) {
          expect(pixel, `pixel (${x}, ${y}) in ${group.name}`).toEqual({ ...group.color, a: 255 });
        } else {
          expect(pixel, `pixel (${x}, ${y})`).toEqual({ r: 0, g: 0, b: 0, a: 0 });
        }
      }
    }
  };

  it("all armor parts are moved correctly", async () => {
    const canvas = await loadArmor(armorLayer1, armorLayer2);
    expect(canvas.width, "canvas width").toBe(64);
    expect(canvas.height, "canvas height").toBe(64);
    expectColors(canvas, [
      { name: "helmet", x0: 40, y0: 0, w: 16, h: 8, color: { r: 255, g: 0, b: 0 } }, // top/bottom
      { name: "helmet", x0: 32, y0: 8, w: 32, h: 8, color: { r: 255, g: 0, b: 0 } }, // right/front/left/back
      { name: "chestplate-body", x0: 20, y0: 32, w: 16, h: 4, color: { r: 0, g: 0, b: 255 } }, // top/bottom
      { name: "chestplate-body", x0: 16, y0: 36, w: 24, h: 12, color: { r: 0, g: 0, b: 255 } }, // right/front/left/back
      { name: "chestplate-left-arm", x0: 52, y0: 48, w: 8, h: 4, color: { r: 255, g: 255, b: 0 } }, // top/bottom
      { name: "chestplate-left-arm", x0: 48, y0: 52, w: 16, h: 12, color: { r: 255, g: 255, b: 0 } }, // right/front/left/back
      { name: "chestplate-right-arm", x0: 44, y0: 32, w: 8, h: 4, color: { r: 255, g: 255, b: 0 } }, // top/bottom
      { name: "chestplate-right-arm", x0: 40, y0: 36, w: 16, h: 12, color: { r: 255, g: 255, b: 0 } }, // right/front/left/back
      { name: "leggings-body", x0: 20, y0: 16, w: 16, h: 4, color: { r: 255, g: 0, b: 255 } }, // top/bottom
      { name: "leggings-body", x0: 16, y0: 20, w: 24, h: 12, color: { r: 255, g: 0, b: 255 } }, // right/front/left/back
      { name: "leggings-left-leg", x0: 4, y0: 16, w: 8, h: 4, color: { r: 0, g: 255, b: 255 } }, // top/bottom
      { name: "leggings-left-leg", x0: 0, y0: 20, w: 16, h: 12, color: { r: 0, g: 255, b: 255 } }, // right/front/left/back
      { name: "leggings-right-leg", x0: 20, y0: 48, w: 8, h: 4, color: { r: 0, g: 255, b: 255 } }, // top/bottom
      { name: "leggings-right-leg", x0: 16, y0: 52, w: 16, h: 12, color: { r: 0, g: 255, b: 255 } }, // right/front/left/back
      { name: "boots-left-leg", x0: 4, y0: 48, w: 8, h: 4, color: { r: 0, g: 255, b: 0 } }, // top/bottom
      { name: "boots-left-leg", x0: 0, y0: 52, w: 16, h: 12, color: { r: 0, g: 255, b: 0 } }, // right/front/left/back
      { name: "boots-right-leg", x0: 4, y0: 32, w: 8, h: 4, color: { r: 0, g: 255, b: 0 } }, // top/bottom
      { name: "boots-right-leg", x0: 0, y0: 36, w: 16, h: 12, color: { r: 0, g: 255, b: 0 } }, // right/front/left/back
    ]);
  });
});