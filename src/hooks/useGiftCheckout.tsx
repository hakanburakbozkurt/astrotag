"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import GiftOrderModal from "@/components/sales/GiftOrderModal";
import {
  buildPurchaseSuccessUrl,
  type GiftOrderDetails,
  type PurchaseOptions,
} from "@/lib/sales/star-packages-catalog";

interface UseGiftCheckoutOptions {
  getCheckoutOptions?: (productId: string) => PurchaseOptions | undefined;
  canProceedToCheckout?: (productId: string) => boolean;
  onGiftPending?: (productId: string, details: GiftOrderDetails) => void;
}

export function useGiftCheckout({
  getCheckoutOptions,
  canProceedToCheckout,
  onGiftPending,
}: UseGiftCheckoutOptions = {}) {
  const router = useRouter();
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftTargetId, setGiftTargetId] = useState<string | null>(null);
  const [giftTargetTitle, setGiftTargetTitle] = useState("Hediye Paketi");

  const navigateToCheckout = useCallback(
    (productId: string, gift?: GiftOrderDetails | null) => {
      const checkoutOptions = getCheckoutOptions?.(productId);

      router.push(
        buildPurchaseSuccessUrl(productId, {
          ...checkoutOptions,
          gift: gift ?? undefined,
        })
      );
    },
    [getCheckoutOptions, router]
  );

  const openGiftModal = useCallback((productId: string, title: string) => {
    setGiftTargetId(productId);
    setGiftTargetTitle(title);
    setGiftModalOpen(true);
  }, []);

  const closeGiftModal = useCallback(() => {
    setGiftModalOpen(false);
  }, []);

  const confirmGift = useCallback(
    (details: GiftOrderDetails) => {
      setGiftModalOpen(false);

      if (!giftTargetId) {
        return;
      }

      if (canProceedToCheckout && !canProceedToCheckout(giftTargetId)) {
        onGiftPending?.(giftTargetId, details);
        return;
      }

      navigateToCheckout(giftTargetId, details);
    },
    [canProceedToCheckout, giftTargetId, navigateToCheckout, onGiftPending]
  );

  const purchase = useCallback(
    (productId: string, gift?: GiftOrderDetails | null) => {
      navigateToCheckout(productId, gift);
    },
    [navigateToCheckout]
  );

  const giftModal = (
    <GiftOrderModal
      open={giftModalOpen}
      packageTitle={giftTargetTitle}
      onClose={closeGiftModal}
      onConfirm={confirmGift}
    />
  );

  return {
    giftModal,
    openGiftModal,
    purchase,
  };
}
