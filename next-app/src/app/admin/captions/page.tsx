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

type ChartRow = {
  name: string;
} & Record<string, number | string>;

const getCaptionMetrics = cache(async () => {
  const captions = await fetchAllFromTable<CaptionRow>("captions", "id,content");
  const votes = await fetchAllFromTable<VoteRow>("caption_votes", "caption_id,vote_value");

  const captionMap = new Map<string, string>();
  (captions as CaptionRow[]).forEach((caption) => {
    captionMap.set(caption.id, caption.content ?? "");
  });

  const lengthBuckets = ["Short", "Medium", "Long"] as const;
  const lengthCounts: Record<string, Record<string, number>> = {
    Upvote: Object.fromEntries(lengthBuckets.map((bucket) => [bucket, 0])),
    Downvote: Object.fromEntries(lengthBuckets.map((bucket) => [bucket, 0])),
  };

  const normalizeOpener = (content: string) => {
    const normalized = content.trim().toLowerCase();
    if (!normalized) return "";
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens[0] === "pov") return "pov";
    return tokens.slice(0, 2).join(" ");
  };

  const classifyLength = (content: string) => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    if (words <= 7) return "Short";
    if (words <= 13) return "Medium";
    return "Long";
  };

  const openerFrequency = new Map<string, number>();
  (captions as CaptionRow[]).forEach((caption) => {
    const opener = normalizeOpener(caption.content ?? "");
    if (!opener) return;
    openerFrequency.set(opener, (openerFrequency.get(opener) ?? 0) + 1);
  });

  const topOpeners = Array.from(openerFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([opener]) => opener);

  const openerBuckets = [...topOpeners, "other"];
  const openerCounts: Record<string, Record<string, number>> = {
    Upvote: Object.fromEntries(openerBuckets.map((bucket) => [bucket, 0])),
    Downvote: Object.fromEntries(openerBuckets.map((bucket) => [bucket, 0])),
  };

  const classifyOpener = (content: string) => {
    const opener = normalizeOpener(content);
    return topOpeners.includes(opener) ? opener : "other";
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

  const buildPercentageRows = (
    counts: Record<string, Record<string, number>>,
    buckets: readonly string[]
  ): ChartRow[] => {
    return buckets.map((bucket) => {
      const upvotes = counts.Upvote[bucket] ?? 0;
      const downvotes = counts.Downvote[bucket] ?? 0;
      const total = upvotes + downvotes;

      return {
        name: bucket,
        Upvote: total > 0 ? (upvotes / total) * 100 : 0,
        UpvoteCount: upvotes,
        Downvote: total > 0 ? (downvotes / total) * 100 : 0,
        DownvoteCount: downvotes,
      };
    });
  };

  const openerData = buildPercentageRows(openerCounts, openerBuckets);
  const lengthData = buildPercentageRows(lengthCounts, lengthBuckets);

  openerData.forEach((row) => {
    if (row.name === "pov") {
      row.name = "POV";
    }
  });

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
      subtitle: "Top 3 most recurring openers + other. Top openers are identified by normalizing each caption, taking pov as its own opener if it starts with POV, otherwise using the first two words, then ranking by frequency across all captions.",
      description:
        "Shows the upvote and downvote percentage for each opener bucket, with raw vote counts displayed inside the bars.",
      legend: ["Upvote", "Downvote"],
      keys: ["Upvote", "Downvote"],
      data: openerData,
    },
    {
      title: "Length Distribution vs votes",
      subtitle: "Caption length buckets and vote polarity.",
      description:
        "Shows the upvote and downvote percentage for each length bucket, with raw vote counts displayed inside the bars.",
      legend: ["Upvote", "Downvote"],
      keys: ["Upvote", "Downvote"],
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
