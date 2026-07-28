"use client";

import { useEffect, useRef, useState } from "react";
import ExpertGridCard from "@/components/experts/ExpertGridCard";
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
  const gridRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const selectedId = controlledSelectedId ?? internalSelectedId;

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const rows = await listPublishedExpertsAction();
      setExperts(rows);
      if (rows[0] && controlledSelectedId === undefined) {
        setInternalSelectedId(rows[0].id);
      }
      setLoading(false);
    })();
  }, [controlledSelectedId]);

  const handleSelect = (expertId: string) => {
    if (controlledSelectedId === undefined) {
      setInternalSelectedId(expertId);
    }
    onSelectExpert?.(expertId);

    const node = gridRefs.current[expertId];
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  if (loading) {
    return <DataLoadingState className="mt-2" />;
  }

  if (experts.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
        Henüz yayında uzman profili yok.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <section aria-label="Uzman hikayeleri">
        <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/35">
          Vitrin
        </p>
        <ExpertStoryBar
          experts={experts}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </section>

      <section aria-label="Uzman listesi">
        <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/35">
          Tüm uzmanlar
        </p>
        <ul className="grid grid-cols-2 gap-3">
          {experts.map((expert) => (
            <li
              key={expert.id}
              ref={(node) => {
                gridRefs.current[expert.id] = node;
              }}
            >
              <ExpertGridCard
                expert={expert}
                selected={selectedId === expert.id}
                onSelect={handleSelect}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
