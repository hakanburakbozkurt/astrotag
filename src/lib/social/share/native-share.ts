import type { SocialShareAsset } from "../types";
import { SOCIAL_VIDEO } from "../constants";

export interface NativeShareInput {
  asset: SocialShareAsset;
  title?: string;
}

export interface NativeShareResult {
  ok: boolean;
  method: "files" | "text" | "unsupported" | "cancelled";
  message: string;
}

export async function shareSocialAssetNative(
  input: NativeShareInput
): Promise<NativeShareResult> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return {
      ok: false,
      method: "unsupported",
      message: "Cihaz paylaşımını desteklemiyor",
    };
  }

  const file = new File([input.asset.blob], input.asset.fileName, {
    type: input.asset.mimeType,
  });

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: input.title ?? "AstroTag",
        text: input.asset.shareText,
        files: [file],
      });
      return { ok: true, method: "files", message: "Paylaşım menüsü açıldı" };
    }

    await navigator.share({
      title: input.title ?? "AstroTag",
      text: input.asset.shareText,
    });
    return { ok: true, method: "text", message: "Metin paylaşımı açıldı" };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, method: "cancelled", message: "Paylaşım iptal edildi" };
    }
    return { ok: false, method: "unsupported", message: "Paylaşım başarısız" };
  }
}

export function downloadSocialAsset(asset: SocialShareAsset): void {
  const url = URL.createObjectURL(asset.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = asset.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function socialAssetFileName(
  module: string,
  extension: "png" | "webp" | typeof SOCIAL_VIDEO.fileExtension
): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `astro-tag-${module}-${stamp}.${extension}`;
}
