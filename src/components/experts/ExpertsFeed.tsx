"use client";

import { useCallback, useEffect, useState } from "react";
import ExpertFeedPostCard from "@/components/experts/ExpertFeedPostCard";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { listExpertFeedAction } from "@/lib/actions/expert-feed";
import type { ExpertFeedPost } from "@/lib/experts/feed.shared";

type ExpertsFeedProps = {
  onSelectExpert?: (expertId: string) => void;
};

export default function ExpertsFeed({ onSelectExpert }: ExpertsFeedProps) {
  const [posts, setPosts] = useState<ExpertFeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const rows = await listExpertFeedAction();
    setPosts(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  if (loading) {
    return (
      <section
        aria-label="Uzman akışı"
        className="border-t border-zinc-800/80 pt-6"
      >
        <DataLoadingState className="mt-2" compact />
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section
        aria-label="Uzman akışı"
        className="border-t border-zinc-800/80 pt-6"
      >
        <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-12 text-center">
          <p className="font-serif text-base text-zinc-400">Akış henüz boş</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-600">
            Uzman duyuruları ve onaylı seans paylaşımları burada görünecek.
            Bir uzman seçerek profiline geçebilirsiniz.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Uzman akışı"
      className="border-t border-zinc-800/80 pt-6"
    >
      <ul className="mx-auto flex max-w-lg flex-col gap-6">
        {posts.map((post) => (
          <li key={post.id}>
            <ExpertFeedPostCard post={post} onSelectExpert={onSelectExpert} />
          </li>
        ))}
      </ul>
    </section>
  );
}
