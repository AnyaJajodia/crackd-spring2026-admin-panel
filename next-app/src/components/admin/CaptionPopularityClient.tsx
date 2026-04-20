"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type CaptionPopularityRow = {
  caption_id: string;
  content: string;
  image_url: string | null;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  net_votes: number;
  created_datetime_utc: string | null;
};

type Props = {
  data: CaptionPopularityRow[];
};

const topOptions = [1, 5, 10] as const;
type TopOption = (typeof topOptions)[number];

const timeRangeOptions = [
  { label: "Last week", value: "week" as const },
  { label: "Last month", value: "month" as const },
  { label: "All time", value: "all" as const },
];
type TimeRange = "week" | "month" | "all";

function filterByTimeRange(
  rows: CaptionPopularityRow[],
  range: TimeRange
): CaptionPopularityRow[] {
  if (range === "all") return rows;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "week") cutoff.setDate(now.getDate() - 7);
  if (range === "month") cutoff.setMonth(now.getMonth() - 1);
  return rows.filter((row) => {
    if (!row.created_datetime_utc) return true;
    return new Date(row.created_datetime_utc) >= cutoff;
  });
}

const BADGE_STYLES = [
  "bg-amber-400 text-amber-900 border-amber-500",
  "bg-slate-200 text-slate-600 border-slate-300",
  "bg-orange-200 text-orange-800 border-orange-300",
];

export function CaptionPopularityClient({ data }: Props) {
  const [tab, setTab] = React.useState<"liked" | "disliked">("liked");
  const [top, setTop] = React.useState<TopOption>(10);
  const [timeRange, setTimeRange] = React.useState<TimeRange>("all");

  const filtered = React.useMemo(() => {
    const inRange = filterByTimeRange(data, timeRange);
    if (tab === "liked") {
      return inRange
        .slice()
        .sort((a, b) => b.net_votes - a.net_votes || b.total_votes - a.total_votes)
        .slice(0, top);
    }
    return inRange
      .slice()
      .sort((a, b) => a.net_votes - b.net_votes || b.total_votes - a.total_votes)
      .slice(0, top);
  }, [data, tab, top, timeRange]);

  const currentTimeLabel =
    timeRangeOptions.find((o) => o.value === timeRange)?.label ?? "All time";

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as "liked" | "disliked")}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="liked">Most liked</TabsTrigger>
          <TabsTrigger value="disliked">Least liked</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium">
              {currentTimeLabel}
              <ChevronDown className="h-4 w-4 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {timeRangeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium">
              Top {top}
              <ChevronDown className="h-4 w-4 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {topOptions.map((option) => (
                <DropdownMenuItem key={option} onClick={() => setTop(option)}>
                  Top {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TabsContent value={tab}>
        {filtered.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-border/70 bg-white/60 text-sm text-muted-foreground">
            No captions found for the selected filters.
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence initial={false}>
              {filtered.map((row, index) => {
                const rank = index + 1;
                const hasBadge = rank <= 3;
                const netVoteDisplay =
                  row.net_votes > 0 ? `+${row.net_votes}` : `${row.net_votes}`;

                return (
                  <motion.div
                    key={row.caption_id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  >
                    <Card className="flex flex-col overflow-hidden transition-shadow duration-300">
                      <CardContent className="flex flex-col gap-4 p-4">
                        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-slate-900/80">
                          {row.image_url ? (
                            <img
                              src={row.image_url}
                              alt="Caption image"
                              className="max-h-72 w-full object-contain"
                            />
                          ) : (
                            <div className="flex min-h-[220px] w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-400">
                              No image
                            </div>
                          )}
                          {hasBadge && (
                            <div
                              className={cn(
                                "absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold shadow-sm",
                                BADGE_STYLES[rank - 1]
                              )}
                            >
                              {rank}
                            </div>
                          )}
                        </div>

                        <p className="line-clamp-3 text-sm leading-snug text-foreground">
                          {row.content || (
                            <span className="italic text-muted-foreground">
                              No caption text
                            </span>
                          )}
                        </p>

                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Net vote
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-2xl font-semibold tabular-nums",
                              row.net_votes > 0 && "text-emerald-600",
                              row.net_votes < 0 && "text-rose-500"
                            )}
                          >
                            {netVoteDisplay}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {row.upvotes} up · {row.downvotes} down · {row.total_votes} total
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </TabsContent>
    </Tabs>
  );
}
