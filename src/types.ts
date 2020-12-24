export type TextureCanvas = HTMLCanvasElement | OffscreenCanvas;
export type TextureSource = HTMLImageElement | HTMLVideoElement | ImageBitmap | TextureCanvas;
export type ModelType = "default" | "slim";

export function isTextureSource(value: unknown): value is TextureSource {
    return value instanceof HTMLImageElement ||
        value instanceof HTMLVideoElement ||
        value instanceof HTMLCanvasElement ||
        (typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap) ||
        (typeof OffscreenCanvas !== "undefined" && value instanceof OffscreenCanvas);
}
