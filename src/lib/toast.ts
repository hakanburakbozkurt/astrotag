"use client";

import hotToast, { Toaster as HotToaster } from "react-hot-toast";
import { createCosmicToastApi, type CosmicToastApi } from "@/lib/cosmic-toast/api";

const cosmicApi = createCosmicToastApi();

export const toast = Object.assign(hotToast, cosmicApi) as typeof hotToast & CosmicToastApi;

export { HotToaster as Toaster };
