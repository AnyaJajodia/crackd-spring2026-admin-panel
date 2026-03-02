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

export type AlignmentRow = {
  image_id: string;
  url: string;
  total_votes: number;
  upvotes: number;
  downvotes: number;
  net_votes: number;
  avg_vote: number;
  controversy_score: number;
};

type AlignmentClientProps = {
  data: AlignmentRow[];
};

const topOptions = [10, 50];
const minVoteOptions = [5, 10, 25, 50];

export function AlignmentClient({ data }: AlignmentClientProps) {
  const [tab, setTab] = React.useState<"consistent" | "controversial">("consistent");
  const [top, setTop] = React.useState(10);
  const [minVotes, setMinVotes] = React.useState(10);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const base = data.filter((row) => row.total_votes >= minVotes);
    if (tab === "consistent") {
      return base
        .slice()
        .sort((a, b) => b.avg_vote - a.avg_vote || b.total_votes - a.total_votes)
        .slice(0, top);
    }
    return base
      .slice()
      .sort(
        (a, b) =>
          b.controversy_score - a.controversy_score || b.total_votes - a.total_votes
      )
      .slice(0, top);
  }, [data, minVotes, tab, top]);

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(null);
    window.setTimeout(() => {
      setExpandedId(id);
    }, 180);
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "consistent" | "controversial")}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="consistent">Most consistent</TabsTrigger>
          <TabsTrigger value="controversial">Most controversial</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap gap-3">
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

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium">
              Min votes {minVotes}
              <ChevronDown className="h-4 w-4 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {minVoteOptions.map((option) => (
                <DropdownMenuItem key={option} onClick={() => setMinVotes(option)}>
                  {option}+
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TabsContent value={tab}>
        <motion.div
          layout
          className="grid auto-rows-[220px] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <AnimatePresence initial={false}>
            {filtered.map((row) => {
              const isExpanded = expandedId === row.image_id;
              return (
                <motion.div
                  key={row.image_id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  className={cn(
                    "group relative h-full cursor-pointer",
                    isExpanded && "sm:col-span-2 sm:row-span-2"
                  )}
                  onClick={() => handleExpand(row.image_id)}
                >
                  <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 group-hover:shadow-lg">
                    <CardContent className="flex h-full flex-col gap-4 p-4">
                      <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/40">
                        {row.url ? (
                          <img
                            src={row.url}
                            alt="Generated"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {tab === "consistent" ? "Avg vote" : "Controversy"}
                          </p>
                          <p className="mt-2 text-2xl font-semibold">
                            {tab === "consistent"
                              ? row.avg_vote.toFixed(2)
                              : row.controversy_score.toFixed(2)}
                          </p>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 grid grid-cols-2 gap-3 text-sm"
                            >
                              <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                                <p className="text-xs uppercase text-muted-foreground">Total</p>
                                <p className="mt-1 text-lg font-semibold">
                                  {row.total_votes}
                                </p>
                              </div>
                              <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                                <p className="text-xs uppercase text-muted-foreground">Net</p>
                                <p className="mt-1 text-lg font-semibold">
                                  {row.net_votes}
                                </p>
                              </div>
                              <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                                <p className="text-xs uppercase text-muted-foreground">Upvotes</p>
                                <p className="mt-1 text-lg font-semibold">
                                  {row.upvotes}
                                </p>
                              </div>
                              <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                                <p className="text-xs uppercase text-muted-foreground">Downvotes</p>
                                <p className="mt-1 text-lg font-semibold">
                                  {row.downvotes}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
