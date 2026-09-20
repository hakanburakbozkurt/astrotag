"use client";

import { useEffect, useState } from "react";
import ExpertStoryBar from "@/components/experts/ExpertStoryBar";
import type { ExpertListItem } from "@/components/experts/experts.types";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { listPublishedExpertsAction } from "@/lib/actions/wallet";

interface ExpertsDirectoryProps {
  selectedId?: string | null;
  onSelectExpert?: (expertId: string) => void;
}

export default function ExpertsDirectory({
  selectedId: controlledSelectedId,
  onSelectExpert,
}: ExpertsDirectoryProps) {
  const [experts, setExperts] = useState<ExpertListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const selectedId = controlledSelectedId ?? internalSelectedId;

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const rows = await listPublishedExpertsAction();
      setExperts(rows);
      setLoading(false);
    })();
  }, []);

  const handleSelect = (expertId: string) => {
    if (controlledSelectedId === undefined) {
      setInternalSelectedId(expertId);
    }
    onSelectExpert?.(expertId);
  };

  if (loading) {
    return <DataLoadingState className="mt-1" compact />;
  }

  if (experts.length === 0) {
    return (
      <p className="px-1 py-4 text-center text-[12px] text-zinc-500">
        Henüz yayında uzman profili yok.
      </p>
    );
  }

  return (
    <div aria-label="Uzman hikayeleri" className="-mx-1 px-1 pb-1">
      <ExpertStoryBar
        experts={experts}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
    </div>
  );
}
