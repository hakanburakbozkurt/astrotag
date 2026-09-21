"use client";

import { useCallback, useEffect, useState } from "react";
import BelongingCard from "@/components/experts/BelongingCard";
import { getViewerSimilarStoriesAction } from "@/lib/actions/similar-stories";
import type { ViewerSimilarStoriesBundle } from "@/lib/similar-stories/similar-stories.shared";

type SimilarStoriesModuleProps = {
  refreshKey?: number;
};

export default function SimilarStoriesModule({ refreshKey = 0 }: SimilarStoriesModuleProps) {
  const [bundle, setBundle] = useState<ViewerSimilarStoriesBundle | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getViewerSimilarStoriesAction();
    setBundle(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2">
        <p className="text-[11px] text-zinc-600">Benzer hikayeler taranıyor…</p>
      </div>
    );
  }

  if (!bundle) {
    return null;
  }

  return <BelongingCard bundle={bundle} />;
}
