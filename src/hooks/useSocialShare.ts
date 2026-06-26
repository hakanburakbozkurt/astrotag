"use client";

import { useCallback, useState, type RefObject } from "react";
import type { SocialSharePayload } from "@/lib/social/types";
import {
  captureChartFromDom,
  downloadSocialAsset,
  renderSocialShareImage,
  runSocialShareEngine,
  shareSocialAssetNative,
} from "@/lib/social/social-share-engine";

interface UseSocialShareOptions {
  payload: SocialSharePayload;
  chartRef: RefObject<HTMLElement | null>;
  includeVideo?: boolean;
}

export function useSocialShare({
  payload,
  chartRef,
  includeVideo = false,
}: UseSocialShareOptions) {
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const captureChart = useCallback(async () => {
    const node = chartRef.current;
    if (!node) {
      throw new Error("Harita yakalanamadı");
    }

    const rect = node.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 360);
    const height = Math.max(Math.round(rect.height), 360);

    return captureChartFromDom(node, width, height);
  }, [chartRef]);

  const exportImage = useCallback(async () => {
    setIsBusy(true);
    setStatus(null);
    try {
      const chart = await captureChart();
      const asset = await renderSocialShareImage({ payload, chart });
      downloadSocialAsset(asset);
      setStatus("Story görseli indirildi");
      return asset;
    } catch {
      setStatus("Görsel oluşturulamadı");
      return null;
    } finally {
      setIsBusy(false);
    }
  }, [captureChart, payload]);

  const exportBundle = useCallback(async () => {
    setIsBusy(true);
    setStatus(null);
    try {
      const result = await runSocialShareEngine({
        payload,
        captureChart,
        includeVideo,
        video: {
          typingText: payload.excerpt ?? payload.body,
        },
      });
      downloadSocialAsset(result.image);
      if (result.video) {
        downloadSocialAsset(result.video);
      }
      setStatus(
        result.video ? "Görsel ve video indirildi" : "Story görseli indirildi"
      );
      return result;
    } catch {
      setStatus("Export başarısız");
      return null;
    } finally {
      setIsBusy(false);
    }
  }, [captureChart, includeVideo, payload]);

  const shareNative = useCallback(async () => {
    setIsBusy(true);
    setStatus(null);
    try {
      const chart = await captureChart();
      const asset = await renderSocialShareImage({ payload, chart });
      const result = await shareSocialAssetNative({
        asset,
        title: payload.title,
      });
      setStatus(result.message);
      return result;
    } catch {
      setStatus("Paylaşım başarısız");
      return null;
    } finally {
      setIsBusy(false);
    }
  }, [captureChart, payload]);

  return {
    status,
    isBusy,
    exportImage,
    exportBundle,
    shareNative,
  };
}
