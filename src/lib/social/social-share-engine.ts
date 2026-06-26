import { SOCIAL_VIDEO } from "./constants";
import { sharePayloadFromAnalysisEnvelope } from "./adapters/from-analysis-context";
import { relationshipSliceToSharePayload } from "./adapters/relationship";
import { createSocialCanvas } from "./render/canvas-layout";
import { renderShareTemplate } from "./render/templates";
import {
  downloadSocialAsset,
  shareSocialAssetNative,
  socialAssetFileName,
} from "./share/native-share";
import type {
  ChartCaptureFn,
  SocialShareAsset,
  SocialShareRenderInput,
  SocialShareResult,
  SocialShareVideoInput,
} from "./types";
import { exportSocialShareVideo } from "./video/video-export-engine";

export type {
  ChartCaptureFn,
  SocialShareAsset,
  SocialSharePayload,
  SocialShareRenderInput,
  SocialShareResult,
  SocialShareVideoInput,
} from "./types";

export {
  sharePayloadFromAnalysisEnvelope,
} from "./adapters/from-analysis-context";
export {
  relationshipSliceToSharePayload,
  synastryCardDataToSharePayload,
} from "./adapters/relationship";
export { buildSynastryBondsSharePayload } from "./adapters/synastry-bonds";

export { buildRelationshipAnalysisSlice, relationshipSliceFromCosmicContext } from "@/lib/astrology/analysis-context";

export { shareSocialAssetNative, downloadSocialAsset, socialAssetFileName };

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG oluşturulamadı"))),
      "image/png"
    );
  });
}

/** 1080×1920 story görseli — ChartEngine raster + AnalysisContext payload. */
export async function renderSocialShareImage(
  input: SocialShareRenderInput
): Promise<SocialShareAsset> {
  if (typeof document === "undefined") {
    throw new Error("Görsel render yalnızca tarayıcıda çalışır");
  }

  const canvas = createSocialCanvas();
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context alınamadı");
  }

  await renderShareTemplate(ctx, input.payload, input.chart.dataUrl);

  const blob = await canvasToPngBlob(canvas);
  return {
    blob,
    mimeType: "image/png",
    fileName: socialAssetFileName(input.payload.module, "png"),
    shareText: input.payload.shareText,
  };
}

export interface RunSocialShareEngineInput {
  payload: SocialShareRenderInput["payload"];
  captureChart: ChartCaptureFn;
  includeVideo?: boolean;
  video?: Omit<SocialShareVideoInput, "payload" | "chart">;
}

/**
 * SocialShareEngine ana orkestratörü.
 * 1) ChartEngine DOM → raster
 * 2) 1080×1920 PNG
 * 3) Opsiyonel WebM video (son 2 sn brand card)
 */
export async function runSocialShareEngine(
  input: RunSocialShareEngineInput
): Promise<SocialShareResult> {
  const chart = await input.captureChart();
  const renderInput: SocialShareRenderInput = {
    payload: input.payload,
    chart,
  };

  const image = await renderSocialShareImage(renderInput);

  if (!input.includeVideo) {
    return { image };
  }

  const videoBlob = await exportSocialShareVideo({
    ...renderInput,
    ...input.video,
    typingText: input.video?.typingText ?? input.payload.excerpt ?? input.payload.body,
  });

  const video: SocialShareAsset = {
    blob: videoBlob,
    mimeType: SOCIAL_VIDEO.mimeType,
    fileName: socialAssetFileName(input.payload.module, SOCIAL_VIDEO.fileExtension),
    shareText: input.payload.shareText,
  };

  return { image, video };
}

/** html-to-image ile ChartEngine kök node'unu rasterize et. */
export async function captureChartFromDom(
  node: HTMLElement,
  width = 720,
  height = 720
): Promise<{ dataUrl: string; width: number; height: number }> {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#0a0f1a",
    width,
    height,
  });

  return { dataUrl, width, height };
}
