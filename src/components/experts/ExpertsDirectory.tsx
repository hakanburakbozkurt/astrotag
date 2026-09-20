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
  /** false → profil detayı açıkken grid gizlenir */
  showExpertGrid?: boolean;
}

export default function ExpertsDirectory({
  selectedId: controlledSelectedId,
  onSelectExpert,
  showExpertGrid = true,
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

    if (showExpertGrid) {
      const node = gridRefs.current[expertId];
      node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  if (loading) {
    return <DataLoadingState className="mt-2" />;
  }

  if (experts.length === 0) {
    return (
      <p className="rounded-sm border border-zinc-800 bg-[#09090b] px-4 py-8 text-center text-sm text-zinc-500">
        Henüz yayında uzman profili yok.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Uzman vitrini"
        className="rounded-sm border border-zinc-800 bg-[#09090b] px-4 py-4 sm:px-5"
      >
        <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-zinc-600">
          Vitrin
        </p>
        <ExpertStoryBar
          experts={experts}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </section>

      {showExpertGrid ? (
        <section aria-label="Tüm uzmanlar" className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
              Tüm uzmanlar
            </p>
            <div className="h-px flex-1 bg-zinc-800" aria-hidden="true" />
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map((expert) => (
              <li
                key={expert.id}
                className="min-h-[156px]"
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
      ) : null}
    </div>
  );
}
