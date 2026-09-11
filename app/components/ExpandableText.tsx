"use client";
import { useI18n } from "./LanguageProvider";

import { useEffect, useId, useRef, useState } from "react";

/** Keeps long descriptions readable on narrow screens without dropping content. */
export function ExpandableText({ text }: { text: string }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const paragraph = useRef<HTMLParagraphElement>(null);
  const id = useId();

  useEffect(() => {
    const element = paragraph.current;
    if (!element) return;
    const measure = () => {
      const threeLines = parseFloat(getComputedStyle(element).lineHeight) * 3;
      setCanExpand(element.scrollHeight > threeLines + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text]);

  return (
    <div className="expandable-text">
      <p ref={paragraph} id={id} data-collapsed={!expanded}>
        {text}
      </p>
      {canExpand ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t("Ringkas deskripsi") : t("Baca deskripsi")}
        </button>
      ) : null}
    </div>
  );
}
