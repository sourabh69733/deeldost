// Browser-only: shrink an image before upload. Phone screenshots are often 3 to 8 MB;
// this brings them to a few hundred KB, which is plenty for reading text.

const MAX_SIDE = 2000;

export async function compressImage(file: File): Promise<{ mediaType: "image/jpeg"; data: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { mediaType: "image/jpeg", data: dataUrl.slice(dataUrl.indexOf(",") + 1) };
}
