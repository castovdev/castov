"use client";

import { useEffect } from "react";
import { recordToolVisit } from "@/components/resume-session-pill";
import type { ToolSlug } from "@/content/tools";

export function ToolTracker({ slug, name }: { slug: ToolSlug; name: string }) {
  useEffect(() => {
    recordToolVisit(slug, name);
  }, [slug, name]);

  return null;
}
