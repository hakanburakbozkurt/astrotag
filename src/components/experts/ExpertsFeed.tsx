"use client";

import { useCallback, useEffect, useState } from "react";
import FeedPostComposer from "@/components/experts/FeedPostComposer";
import SocialFeedPostCard from "@/components/experts/SocialFeedPostCard";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { listExpertFeedAction } from "@/lib/actions/expert-feed";
import type { FeedPost } from "@/lib/experts/feed.shared";

type ExpertsFeedProps = {
  onSelectExpert?: (expertId: string) => void;
};

const FEED_REFRESH_MS = 45_000;

export default function ExpertsFeed({ onSelectExpert }: ExpertsFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    const rows = await listExpertFeedAction();
    setPosts(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadFeed(true);
    }, FEED_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [loadFeed]);

  return (
    <section aria-label="Kozmik akış" className="border-t border-zinc-800/80 pt-4">
      <div className="mx-auto flex max-w-md flex-col gap-2.5">
        <FeedPostComposer onPosted={() => void loadFeed(true)} />

        {loading ? (
          <DataLoadingState className="mt-1" compact />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
            <p className="font-serif text-sm text-zinc-400">Akış henüz boş</p>
            <p className="mt-1.5 max-w-xs text-[12px] leading-relaxed text-zinc-600">
              İlk kozmik düşüncenizi paylaşın veya bir uzman seçerek vitrine geçin.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {posts.map((post) => (
              <li key={post.id}>
                <SocialFeedPostCard
                  post={post}
                  onSelectExpert={onSelectExpert}
                  onEngagementChange={() => void loadFeed(true)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
