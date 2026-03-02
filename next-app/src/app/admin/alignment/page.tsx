import { cache } from "react";

import { AlignmentClient, type AlignmentRow } from "@/components/admin/AlignmentClient";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { fetchAllFromTable } from "@/lib/supabase/fetchAll";

type CaptionRow = {
  id: string;
  image_id: string | null;
};

type VoteRow = {
  caption_id: string | null;
  vote_value: number | null;
};

type ImageRow = {
  id: string;
  url: string | null;
};

const getAlignmentData = cache(async () => {
  const captions = await fetchAllFromTable<CaptionRow>("captions", "id,image_id");
  const votes = await fetchAllFromTable<VoteRow>("caption_votes", "caption_id,vote_value");
  const images = await fetchAllFromTable<ImageRow>("images", "id,url");

  const captionToImage = new Map<string, string>();
  (captions as CaptionRow[]).forEach((caption) => {
    if (caption.image_id) {
      captionToImage.set(caption.id, caption.image_id);
    }
  });

  const imageUrlMap = new Map<string, string>();
  (images as ImageRow[]).forEach((image) => {
    imageUrlMap.set(image.id, image.url ?? "");
  });

  const stats = new Map<string, AlignmentRow>();

  (votes as VoteRow[]).forEach((vote) => {
    if (!vote.caption_id || !vote.vote_value) return;
    const imageId = captionToImage.get(vote.caption_id);
    if (!imageId) return;
    const entry =
      stats.get(imageId) ??
      ({
        image_id: imageId,
        url: imageUrlMap.get(imageId) ?? "",
        total_votes: 0,
        upvotes: 0,
        downvotes: 0,
        net_votes: 0,
        avg_vote: 0,
        controversy_score: 0,
      } satisfies AlignmentRow);
    entry.total_votes += 1;
    if (vote.vote_value === 1) {
      entry.upvotes += 1;
    } else {
      entry.downvotes += 1;
    }
    entry.net_votes += vote.vote_value;
    stats.set(imageId, entry);
  });

  const rows: AlignmentRow[] = [];
  stats.forEach((entry) => {
    const total = entry.total_votes;
    entry.avg_vote = total > 0 ? entry.net_votes / total : 0;
    const splitScore =
      total > 0 ? 1 - Math.abs(entry.upvotes - entry.downvotes) / total : 0;
    entry.controversy_score = splitScore * Math.log(1 + total);
    rows.push(entry);
  });

  return rows;
});

export default async function AlignmentPage() {
  await requireSuperadmin();
  const data = await getAlignmentData();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Image–Caption Alignment</h1>
        <p className="text-sm text-muted-foreground">
          Consistent images earn steady upvotes across captions. Controversial images
          split the room with mixed sentiment and high engagement.
        </p>
      </div>
      <AlignmentClient data={data} />
    </section>
  );
}
