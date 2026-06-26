"use client";

import { useCallback, useEffect, useState } from "react";
import type { NatalChartViewMode } from "@/lib/astrology/types";
import {
  readNatalScreenPreferences,
  writeNatalScreenPreferences,
  type NatalScreenSection,
} from "@/lib/natal/natal-screen-preferences.client";

export function useNatalScreenPreferences() {
  const [ready, setReady] = useState(false);
  const [section, setSectionState] = useState<NatalScreenSection>("chart");
  const [chartViewMode, setChartViewModeState] =
    useState<NatalChartViewMode>("classic");

  useEffect(() => {
    const stored = readNatalScreenPreferences();
    setSectionState(stored.section);
    setChartViewModeState(stored.chartViewMode);
    setReady(true);
  }, []);

  const setSection = useCallback((value: NatalScreenSection) => {
    setSectionState(value);
    const current = readNatalScreenPreferences();
    writeNatalScreenPreferences({ ...current, section: value });
  }, []);

  const setChartViewMode = useCallback((value: NatalChartViewMode) => {
    setChartViewModeState(value);
    const current = readNatalScreenPreferences();
    writeNatalScreenPreferences({ ...current, chartViewMode: value });
  }, []);

  return {
    ready,
    section,
    setSection,
    chartViewMode,
    setChartViewMode,
  };
}
