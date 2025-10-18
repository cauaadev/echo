export default function getCroppedImg(imageSrc, pixelCrop) {
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.crossOrigin = "anonymous";
        image.onload = () => {
            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error("Canvas is empty"));
                const file = new File([blob], "avatar.png", { type: "image/png" });
                resolve(file);
            }, "image/png");
        };
        image.onerror = reject;
    });
}
