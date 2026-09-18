"use client";

import { memo, useMemo } from "react";
import AstrologyExplainButton from "@/components/astrology/AstrologyExplainButton";
import {
  explainTechnicalLine,
  parseCautionBody,
  type CautionListItem,
} from "@/lib/astrology/plain-language-caution";

interface CautionItemsListProps {
  body: string;
}

function CautionItemRow({ item }: { item: CautionListItem }) {
  const explanation = useMemo(
    () => explainTechnicalLine(item.technical),
    [item.technical]
  );

  return (
    <li className="rounded-sm border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/72">{item.raw}</p>
        <AstrologyExplainButton explanation={explanation} />
      </div>
    </li>
  );
}

function CautionItemsListInner({ body }: CautionItemsListProps) {
  const parsed = useMemo(() => parseCautionBody(body), [body]);

  if (parsed.items.length === 0) {
    return (
      <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-white/72">
        {body}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {parsed.intro ? (
        <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-white/65">
          {parsed.intro}
        </p>
      ) : null}
      <ul className="space-y-2">
        {parsed.items.map((item) => (
          <CautionItemRow key={item.technical} item={item} />
        ))}
      </ul>
    </div>
  );
}

export default memo(CautionItemsListInner);
