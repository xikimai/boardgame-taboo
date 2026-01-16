import html2canvas from 'html2canvas';

/**
 * Capture an HTML element as a PNG blob.
 * Uses 2x scale for higher quality on retina displays.
 */
export async function captureElement(element: HTMLElement): Promise<Blob | null> {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    logging: false,
  });

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

/**
 * Copy an image blob to the clipboard.
 * Returns true on success, false if clipboard API is unavailable.
 */
export async function copyToClipboard(blob: Blob): Promise<boolean> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download an image blob as a file.
 * Fallback for browsers that don't support clipboard image copy.
 */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Combined capture and share function.
 * Tries clipboard first, falls back to download.
 * Returns 'copied' | 'downloaded' | 'failed'
 */
export async function captureAndShare(
  element: HTMLElement,
  filename: string = 'taboo-result.png'
): Promise<'copied' | 'downloaded' | 'failed'> {
  const blob = await captureElement(element);

  if (!blob) {
    return 'failed';
  }

  const copied = await copyToClipboard(blob);

  if (copied) {
    return 'copied';
  }

  // Fallback to download
  downloadImage(blob, filename);
  return 'downloaded';
}
