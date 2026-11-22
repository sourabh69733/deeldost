// Browser only: share an image through the phone's share sheet, or download it on desktop.
// Resolves true when the image was shared or downloaded, false if the user cancelled or it failed.
export async function shareImage(url: string, filename: string, title: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
    } else {
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    return true;
  } catch {
    return false; // share sheet closed or download blocked
  }
}
