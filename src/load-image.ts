export type RemoteImage = string | {
    src: string;
    /** @defaultvalue "anonymous" */
    crossOrigin?: string | null;
    referrerPolicy?: string;
};

export async function loadImage(source: RemoteImage): Promise<HTMLImageElement> {
    const image = document.createElement("img");
    return new Promise((resolve, reject) => {
        image.onload = (): void => resolve(image);
        image.onerror = reject;
        image.crossOrigin = "anonymous";
        if (typeof source === "string") {
            image.src = source;
        } else {
            if (source.crossOrigin !== undefined) {
                image.crossOrigin = source.crossOrigin;
            }
            if (source.referrerPolicy !== undefined) {
                image.referrerPolicy = source.referrerPolicy;
            }
            image.src = source.src;
        }
    });
}
