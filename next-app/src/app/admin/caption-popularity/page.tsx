import { cache } from "react";

import {
  CaptionPopularityClient,
  type CaptionPopularityRow,
} from "@/components/admin/CaptionPopularityClient";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { fetchAllFromTable } from "@/lib/supabase/fetchAll";

type CaptionRow = {
  id: string;
  content: string | null;
  image_id: string | null;
  created_datetime_utc: string | null;
};

type VoteRow = {
  caption_id: string | null;
  vote_value: number | null;
};

type ImageRow = {
  id: string;
  url: string | null;
};

const getCaptionPopularityData = cache(async () => {
  const captions = await fetchAllFromTable<CaptionRow>(
    "captions",
    "id,content,image_id,created_datetime_utc"
  );
  const votes = await fetchAllFromTable<VoteRow>(
    "caption_votes",
    "caption_id,vote_value"
  );
  const images = await fetchAllFromTable<ImageRow>("images", "id,url");

  const imageUrlMap = new Map<string, string>();
  (images as ImageRow[]).forEach((image) => {
    imageUrlMap.set(image.id, image.url ?? "");
  });

  const captionMeta = new Map<
    string,
    { content: string; image_id: string | null; created_datetime_utc: string | null }
  >();
  (captions as CaptionRow[]).forEach((caption) => {
    captionMeta.set(caption.id, {
      content: caption.content ?? "",
      image_id: caption.image_id,
      created_datetime_utc: caption.created_datetime_utc,
    });
  });

  const voteStats = new Map<
    string,
    { upvotes: number; downvotes: number; net_votes: number; total_votes: number }
  >();
  (votes as VoteRow[]).forEach((vote) => {
    if (!vote.caption_id || !vote.vote_value) return;
    const entry = voteStats.get(vote.caption_id) ?? {
      upvotes: 0,
      downvotes: 0,
      net_votes: 0,
      total_votes: 0,
    };
    entry.total_votes += 1;
    if (vote.vote_value === 1) {
      entry.upvotes += 1;
    } else {
      entry.downvotes += 1;
    }
    entry.net_votes += vote.vote_value;
    voteStats.set(vote.caption_id, entry);
  });

  const rows: CaptionPopularityRow[] = [];
  voteStats.forEach((stats, captionId) => {
    const meta = captionMeta.get(captionId);
    if (!meta) return;
    const imageUrl = meta.image_id ? (imageUrlMap.get(meta.image_id) ?? null) : null;
    rows.push({
      caption_id: captionId,
      content: meta.content,
      image_url: imageUrl,
      upvotes: stats.upvotes,
      downvotes: stats.downvotes,
      total_votes: stats.total_votes,
      net_votes: stats.net_votes,
      created_datetime_utc: meta.created_datetime_utc,
    });
  });

  return rows;
});

export default async function CaptionPopularityPage() {
  await requireSuperadmin();
  const data = await getCaptionPopularityData();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Caption Popularity</h1>
        <p className="text-sm text-muted-foreground">
          Most liked and least liked captions based on net vote score.
        </p>
      </div>
      <CaptionPopularityClient data={data} />
    </section>
  );
}
