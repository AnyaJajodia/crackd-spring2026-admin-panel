import { cache } from "react";

import { CaptionStepper } from "@/components/admin/CaptionStepper";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { fetchAllFromTable } from "@/lib/supabase/fetchAll";

type CaptionRow = {
  id: string;
  content: string | null;
};

type VoteRow = {
  caption_id: string | null;
  vote_value: number | null;
};

const getCaptionMetrics = cache(async () => {
  const captions = await fetchAllFromTable<CaptionRow>("captions", "id,content");
  const votes = await fetchAllFromTable<VoteRow>("caption_votes", "caption_id,vote_value");

  const captionMap = new Map<string, string>();
  (captions as CaptionRow[]).forEach((caption) => {
    captionMap.set(caption.id, caption.content ?? "");
  });

  const openerBuckets = ["me when", "when you", "pov", "other"] as const;
  const lengthBuckets = ["Short", "Medium", "Long"] as const;
  const openerCounts: Record<string, Record<string, number>> = {
    Upvote: Object.fromEntries(openerBuckets.map((bucket) => [bucket, 0])),
    Downvote: Object.fromEntries(openerBuckets.map((bucket) => [bucket, 0])),
  };
  const lengthCounts: Record<string, Record<string, number>> = {
    Upvote: Object.fromEntries(lengthBuckets.map((bucket) => [bucket, 0])),
    Downvote: Object.fromEntries(lengthBuckets.map((bucket) => [bucket, 0])),
  };

  const classifyOpener = (content: string) => {
    const normalized = content.trim().toLowerCase();
    if (normalized.startsWith("me when")) return "me when";
    if (normalized.startsWith("when you")) return "when you";
    if (normalized.startsWith("pov")) return "pov";
    return "other";
  };

  const classifyLength = (content: string) => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    if (words <= 7) return "Short";
    if (words <= 13) return "Medium";
    return "Long";
  };

  (votes as VoteRow[]).forEach((vote) => {
    if (!vote.caption_id || !vote.vote_value) return;
    const content = captionMap.get(vote.caption_id);
    if (!content) return;
    const group = vote.vote_value === 1 ? "Upvote" : "Downvote";
    const opener = classifyOpener(content);
    const lengthBucket = classifyLength(content);
    openerCounts[group][opener] += 1;
    lengthCounts[group][lengthBucket] += 1;
  });

  const openerData = [
    { name: "Upvote", ...openerCounts.Upvote },
    { name: "Downvote", ...openerCounts.Downvote },
  ];

  const lengthData = [
    { name: "Upvote", ...lengthCounts.Upvote },
    { name: "Downvote", ...lengthCounts.Downvote },
  ];

  return { openerData, lengthData };
});

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ bootstrapped?: string }>;
}) {
  await requireSuperadmin();
  const { openerData, lengthData } = await getCaptionMetrics();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const steps = [
    {
      title: "Overused Openers",
      subtitle: "Opening phrases and their sentiment split.",
      description:
        "Counts upvotes and downvotes for each opener bucket to surface fatigue signals.",
      legend: ["me when", "when you", "POV", "other"],
      keys: ["me when", "when you", "pov", "other"],
      data: openerData,
    },
    {
      title: "Length Distribution vs votes",
      subtitle: "Caption length buckets and vote polarity.",
      description:
        "Compares short, medium, and long captions to highlight sentiment shifts.",
      legend: ["Short", "Medium", "Long"],
      keys: ["Short", "Medium", "Long"],
      data: lengthData,
    },
  ];

  const bootstrapped =
    resolvedSearchParams?.bootstrapped === "success" ||
    resolvedSearchParams?.bootstrapped === "already"
      ? (resolvedSearchParams.bootstrapped as "success" | "already")
      : undefined;

  return (
    <section className="space-y-8">
      <CaptionStepper steps={steps} bootstrapped={bootstrapped} />
    </section>
  );
}
