"use client";

import { useEffect, useRef, useState } from "react";

const CHAR_DELAY_MS = 18;

interface TarotTypewriterTextProps {
  text: string;
  active?: boolean;
  className?: string;
  onComplete?: () => void;
}

export default function TarotTypewriterText({
  text,
  active = true,
  className = "",
  onComplete,
}: TarotTypewriterTextProps) {
  const [visibleLength, setVisibleLength] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) {
      setVisibleLength(text.length);
      onCompleteRef.current?.();
      return;
    }

    setVisibleLength(0);
    let index = 0;

    const timer = setInterval(() => {
      index += 1;
      setVisibleLength(index);

      if (index >= text.length) {
        clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, CHAR_DELAY_MS);

    return () => clearInterval(timer);
  }, [text, active]);

  const visibleText = text.slice(0, visibleLength);
  const isTyping = active && visibleLength < text.length;

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {visibleText}
      {isTyping ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block w-[2px] animate-pulse bg-amber-300/80 align-middle"
          style={{ height: "1em" }}
        />
      ) : null}
    </p>
  );
}
