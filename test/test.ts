/// <reference path="shims.d.ts"/>

import { expect } from "chai";

import { inferModelType, loadSkinToCanvas, loadImage, isTextureSource } from "../src/index";

import skin1_8Default from "./textures/skin-1.8-default-no_hd.png";
import skin1_8Slim from "./textures/skin-1.8-slim-no_hd.png";
import skinOldDefault from "./textures/skin-old-default-no_hd.png";
import skinLegacyHatDefault from "./textures/skin-legacyhat-default-no_hd.png";
import skin1_8SlimBlackedge from "./textures/skin-1.8-slim-no_hd-blackedge.png";
import skin1_8SlimWhiteedge from "./textures/skin-1.8-slim-no_hd-whiteedge.png";
import skin1_8Opaque from "./textures/skin-1.8_opaque-default-no_hd.png";

async function loadSkin(src: string) {
	const texture = await loadImage(src);
	const canvas = document.createElement("canvas");
	loadSkinToCanvas(canvas, texture);
	return canvas;
}

describe("detect model of texture", () => {
	it("1.8 default", async () =>
		expect(inferModelType(await loadSkin(skin1_8Default))).to.equal("default")
	);

	it("1.8 slim", async () =>
		expect(inferModelType(await loadSkin(skin1_8Slim))).to.equal("slim")
	);

	it("old default", async () =>
		expect(inferModelType(await loadSkin(skinOldDefault))).to.equal("default")
	);

	it("1.8 slim blackedge", async () =>
		expect(inferModelType(await loadSkin(skin1_8SlimBlackedge))).to.equal("slim")
	);

	it("1.8 slim whiteedge", async () =>
		expect(inferModelType(await loadSkin(skin1_8SlimWhiteedge))).to.equal("slim")
	);
});

describe("process skin texture", () => {
	const expectTransparent = (canvas: HTMLCanvasElement, x0: number, y0: number, w: number, h: number) => {
		const ctx = canvas.getContext("2d", { willReadFrequently: true })

		const data = ctx!.getImageData(x0, y0, w, h).data;
		for (let x = 0; x < w; x++) {
			for (let y = 0; y < h; y++) {
				expect(data[(y * h + x) * 4 + 3], `pixel (${x0 + x}, ${y0 + y})`).to.equal(0);
			}
		}
	};

	it("clear the hat area of legacy skin", async () => {
		const canvas = await loadSkin(skinLegacyHatDefault);
		expectTransparent(canvas, 40, 0, 8 * 2, 8); // top + bottom
		expectTransparent(canvas, 32, 8, 8 * 4, 8)  // right + front + left + back
	});

	it("clear the 2nd layer of opaque skin", async () => {
		const canvas = await loadSkin(skin1_8Opaque);
		expectTransparent(canvas, 40, 0, 16, 8);   // HEAD2: top + bottom
		expectTransparent(canvas, 32, 8, 32, 8)    // HEAD2: right + front + left + back
		expectTransparent(canvas, 0, 36, 56, 12);  // RL2, BODY2, RA2: right + front + left + back
		expectTransparent(canvas, 4, 32, 8, 4);    // RL2: top + bottom
		expectTransparent(canvas, 20, 32, 16, 4);  // BODY2: top + bottom
		expectTransparent(canvas, 44, 32, 8, 4);   // RA2: top + bottom
		expectTransparent(canvas, 0, 52, 16, 12);  // LL2:right + front + left + back
		expectTransparent(canvas, 4, 48, 8, 4);    // LL2: top + bottom
		expectTransparent(canvas, 48, 52, 16, 12); // LA2: right + front + left + back
		expectTransparent(canvas, 52, 48, 8, 4);   // LA2: top + bottom
	});
});

describe("isTextureSource", () => {
	it("returns true for <img>", () => {
		const el = document.createElement("img");
		expect(isTextureSource(el)).to.be.true;
	});
	it("returns true for <video>", () => {
		const el = document.createElement("video");
		expect(isTextureSource(el)).to.be.true;
	});
	it("returns true for <canvas>", () => {
		const el = document.createElement("canvas");
		expect(isTextureSource(el)).to.be.true;
	});
	it("returns true for ImageBitmap", async () => {
		const bitmap = await createImageBitmap(await loadSkin(skin1_8Default));
		expect(isTextureSource(bitmap)).to.be.true;
	});
	it("returns true for OffscreenCanvas", () => {
		const canvas = new OffscreenCanvas(1, 1);
		expect(isTextureSource(canvas)).to.be.true;
	});
	it("returns false for {}", () => {
		expect(isTextureSource({})).to.be.false;
	});
	it("returns false for {src:...}", () => {
		expect(isTextureSource({
			src: "https://example.com/image.png"
		})).to.be.false;
	});
});
