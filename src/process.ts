import { TextureCanvas, TextureSource, ModelType } from "./types.js";

type CanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function hasTransparency(context: CanvasImageData, x0: number, y0: number, w: number, h: number): boolean {
	const imgData = context.getImageData(x0, y0, w, h);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < h; y++) {
			const offset = (x + y * w) * 4;
			if (imgData.data[offset + 3] !== 0xff) {
				return true;
			}
		}
	}
	return false;
}

function computeSkinScale(width: number): number {
	return width / 64.0;
}

function fixOpaqueSkin(context: CanvasImageData & CanvasRect, width: number, format1_8: boolean): void {
	// see https://github.com/bs-community/skinview3d/issues/15
	// see https://github.com/bs-community/skinview3d/issues/93

	// check whether the skin has opaque background
	if (format1_8) {
		if (hasTransparency(context, 0, 0, width, width))
			return;
	} else {
		if (hasTransparency(context, 0, 0, width, width / 2))
			return;
	}

	const scale = computeSkinScale(width);
	const clearArea = (x: number, y: number, w: number, h: number): void =>
		context.clearRect(x * scale, y * scale, w * scale, h * scale);

	clearArea(40, 0, 8, 8); // Helm Top
	clearArea(48, 0, 8, 8); // Helm Bottom
	clearArea(32, 8, 8, 8); // Helm Right
	clearArea(40, 8, 8, 8); // Helm Front
	clearArea(48, 8, 8, 8); // Helm Left
	clearArea(56, 8, 8, 8); // Helm Back

	if (format1_8) {
		clearArea(4, 32, 4, 4); // Right Leg Layer 2 Top
		clearArea(8, 32, 4, 4); // Right Leg Layer 2 Bottom
		clearArea(0, 36, 4, 12); // Right Leg Layer 2 Right
		clearArea(4, 36, 4, 12); // Right Leg Layer 2 Front
		clearArea(8, 36, 4, 12); // Right Leg Layer 2 Left
		clearArea(12, 36, 4, 12); // Right Leg Layer 2 Back
		clearArea(20, 32, 8, 4); // Torso Layer 2 Top
		clearArea(28, 32, 8, 4); // Torso Layer 2 Bottom
		clearArea(16, 36, 4, 12); // Torso Layer 2 Right
		clearArea(20, 36, 8, 12); // Torso Layer 2 Front
		clearArea(28, 36, 4, 12); // Torso Layer 2 Left
		clearArea(32, 36, 8, 12); // Torso Layer 2 Back
		clearArea(44, 32, 4, 4); // Right Arm Layer 2 Top
		clearArea(48, 32, 4, 4); // Right Arm Layer 2 Bottom
		clearArea(40, 36, 4, 12); // Right Arm Layer 2 Right
		clearArea(44, 36, 4, 12); // Right Arm Layer 2 Front
		clearArea(48, 36, 4, 12); // Right Arm Layer 2 Left
		clearArea(52, 36, 12, 12); // Right Arm Layer 2 Back
		clearArea(4, 48, 4, 4); // Left Leg Layer 2 Top
		clearArea(8, 48, 4, 4); // Left Leg Layer 2 Bottom
		clearArea(0, 52, 4, 12); // Left Leg Layer 2 Right
		clearArea(4, 52, 4, 12); // Left Leg Layer 2 Front
		clearArea(8, 52, 4, 12); // Left Leg Layer 2 Left
		clearArea(12, 52, 4, 12); // Left Leg Layer 2 Back
		clearArea(52, 48, 4, 4); // Left Arm Layer 2 Top
		clearArea(56, 48, 4, 4); // Left Arm Layer 2 Bottom
		clearArea(48, 52, 4, 12); // Left Arm Layer 2 Right
		clearArea(52, 52, 4, 12); // Left Arm Layer 2 Front
		clearArea(56, 52, 4, 12); // Left Arm Layer 2 Left
		clearArea(60, 52, 4, 12); // Left Arm Layer 2 Back
	}
}

function convertSkinTo1_8(context: CanvasContext, width: number): void {
	// Copied parts are horizontally flipped
	context.save();
	context.scale(-1, 1);

	const scale = computeSkinScale(width);
	const copySkin = (sX: number, sY: number, w: number, h: number, dX: number, dY: number): void =>
		context.drawImage(context.canvas, sX * scale, sY * scale, w * scale, h * scale, -dX * scale, dY * scale, -w * scale, h * scale);

	copySkin(4, 16, 4, 4, 20, 48); // Top Leg
	copySkin(8, 16, 4, 4, 24, 48); // Bottom Leg
	copySkin(0, 20, 4, 12, 24, 52); // Outer Leg
	copySkin(4, 20, 4, 12, 20, 52); // Front Leg
	copySkin(8, 20, 4, 12, 16, 52); // Inner Leg
	copySkin(12, 20, 4, 12, 28, 52); // Back Leg
	copySkin(44, 16, 4, 4, 36, 48); // Top Arm
	copySkin(48, 16, 4, 4, 40, 48); // Bottom Arm
	copySkin(40, 20, 4, 12, 40, 52); // Outer Arm
	copySkin(44, 20, 4, 12, 36, 52); // Front Arm
	copySkin(48, 20, 4, 12, 32, 52); // Inner Arm
	copySkin(52, 20, 4, 12, 44, 52); // Back Arm

	context.restore();
}

export function loadSkinToCanvas(canvas: TextureCanvas, image: TextureSource): void {
	let isOldFormat = false;
	if (image.width !== image.height) {
		if (image.width === 2 * image.height) {
			isOldFormat = true;
		} else {
			throw new Error(`Bad skin size: ${image.width}x${image.height}`);
		}
	}

	const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasContext;
	if (isOldFormat) {
		const sideLength = image.width;
		canvas.width = sideLength;
		canvas.height = sideLength;
		context.clearRect(0, 0, sideLength, sideLength);
		context.drawImage(image, 0, 0, sideLength, sideLength / 2.0);
		convertSkinTo1_8(context, sideLength);
		fixOpaqueSkin(context, canvas.width, false);
	} else {
		canvas.width = image.width;
		canvas.height = image.height;
		context.clearRect(0, 0, image.width, image.height);
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		fixOpaqueSkin(context, canvas.width, true);
	}
}

function computeCapeScale(image: TextureSource): number {
	if (image.width === 2 * image.height) {
		// 64x32
		return image.width / 64;
	} else if (image.width * 17 === image.height * 22) {
		// 22x17
		return image.width / 22;
	} else if (image.width * 11 === image.height * 23) {
		// 46x22
		return image.width / 46;
	} else {
		throw new Error(`Bad cape size: ${image.width}x${image.height}`);
	}
}

export function loadCapeToCanvas(canvas: TextureCanvas, image: TextureSource): void {
	const scale = computeCapeScale(image);
	canvas.width = 64 * scale;
	canvas.height = 32 * scale;

	const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasContext;
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.drawImage(image, 0, 0, image.width, image.height);
}

function isAreaBlack(context: CanvasImageData, x0: number, y0: number, w: number, h: number): boolean {
	const imgData = context.getImageData(x0, y0, w, h);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < h; y++) {
			const offset = (x + y * w) * 4;
			if (!(
				imgData.data[offset + 0] === 0 &&
				imgData.data[offset + 1] === 0 &&
				imgData.data[offset + 2] === 0 &&
				imgData.data[offset + 3] === 0xff
			)) {
				return false;
			}
		}
	}
	return true;
}

function isAreaWhite(context: CanvasImageData, x0: number, y0: number, w: number, h: number): boolean {
	const imgData = context.getImageData(x0, y0, w, h);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < h; y++) {
			const offset = (x + y * w) * 4;
			if (!(
				imgData.data[offset + 0] === 0xff &&
				imgData.data[offset + 1] === 0xff &&
				imgData.data[offset + 2] === 0xff &&
				imgData.data[offset + 3] === 0xff
			)) {
				return false;
			}
		}
	}
	return true;
}

export function inferModelType(canvas: TextureCanvas): ModelType {
	// The right arm area of *default* skins:
	// (44,16)->*-------*-------*
	// (40,20)  |top    |bottom |
	// \|/      |4x4    |4x4    |
	//  *-------*-------*-------*-------*
	//  |right  |front  |left   |back   |
	//  |4x12   |4x12   |4x12   |4x12   |
	//  *-------*-------*-------*-------*
	// The right arm area of *slim* skins:
	// (44,16)->*------*------*-*
	// (40,20)  |top   |bottom| |<----[x0=50,y0=16,w=2,h=4]
	// \|/      |3x4   |3x4   | |
	//  *-------*------*------***-----*-*
	//  |right  |front |left   |back  | |<----[x0=54,y0=20,w=2,h=12]
	//  |4x12   |3x12  |4x12   |3x12  | |
	//  *-------*------*-------*------*-*
	// Compared with default right arms, slim right arms have 2 unused areas.
	//
	// The same is true for left arm:
	// The left arm area of *default* skins:
	// (36,48)->*-------*-------*
	// (32,52)  |top    |bottom |
	// \|/      |4x4    |4x4    |
	//  *-------*-------*-------*-------*
	//  |right  |front  |left   |back   |
	//  |4x12   |4x12   |4x12   |4x12   |
	//  *-------*-------*-------*-------*
	// The left arm area of *slim* skins:
	// (36,48)->*------*------*-*
	// (32,52)  |top   |bottom| |<----[x0=42,y0=48,w=2,h=4]
	// \|/      |3x4   |3x4   | |
	//  *-------*------*------***-----*-*
	//  |right  |front |left   |back  | |<----[x0=46,y0=52,w=2,h=12]
	//  |4x12   |3x12  |4x12   |3x12  | |
	//  *-------*------*-------*------*-*
	//
	// If there is a transparent pixel in any of the 4 unused areas, the skin must be slim,
	// as transparent pixels are not allowed in the first layer.
	// If the 4 areas are all black or all white, the skin is also considered as slim.

	const scale = computeSkinScale(canvas.width);
	const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasContext;
	const checkTransparency = (x: number, y: number, w: number, h: number): boolean =>
		hasTransparency(context, x * scale, y * scale, w * scale, h * scale);
	const checkBlack = (x: number, y: number, w: number, h: number): boolean =>
		isAreaBlack(context, x * scale, y * scale, w * scale, h * scale);
	const checkWhite = (x: number, y: number, w: number, h: number): boolean =>
		isAreaWhite(context, x * scale, y * scale, w * scale, h * scale);
	const isSlim =
		(
			checkTransparency(50, 16, 2, 4) ||
			checkTransparency(54, 20, 2, 12) ||
			checkTransparency(42, 48, 2, 4) ||
			checkTransparency(46, 52, 2, 12)
		) ||
		(
			checkBlack(50, 16, 2, 4) &&
			checkBlack(54, 20, 2, 12) &&
			checkBlack(42, 48, 2, 4) &&
			checkBlack(46, 52, 2, 12)
		) ||
		(
			checkWhite(50, 16, 2, 4) &&
			checkWhite(54, 20, 2, 12) &&
			checkWhite(42, 48, 2, 4) &&
			checkWhite(46, 52, 2, 12)
		);
	return isSlim ? "slim" : "default";
}

function computeEarsScale(image: TextureSource): number {
	if (image.width === image.height * 2 && image.height % 7 === 0) {
		return image.height / 7;
	} else {
		throw new Error(`Bad ears size: ${image.width}x${image.height}`);
	}
}

export function loadEarsToCanvas(canvas: TextureCanvas, image: TextureSource): void {
	const scale = computeEarsScale(image);
	canvas.width = 14 * scale;
	canvas.height = 7 * scale;

	const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasContext;
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.drawImage(image, 0, 0, image.width, image.height);
}

export function loadEarsToCanvasFromSkin(canvas: TextureCanvas, image: TextureSource): void {
	if (image.width !== image.height && image.width !== 2 * image.height) {
		throw new Error(`Bad skin size: ${image.width}x${image.height}`);
	}

	const scale = computeSkinScale(image.width);
	const w = 14 * scale;
	const h = 7 * scale;
	canvas.width = w;
	canvas.height = h;
	const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasContext;
	context.clearRect(0, 0, w, h);
	context.drawImage(image, 24 * scale, 0, w, h, 0, 0, w, h);
}
