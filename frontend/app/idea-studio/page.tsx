"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useState } from "react";

type Idea = { title: string; description: string };

export default function IdeaStudioPage() {
  const [theme, setTheme] = useState("");
  const [members, setMembers] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const generateIdeas = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIdeas([
      { title: "AI Sprint Planner", description: "Generate tasks and timelines for hackathons." },
      { title: "Repo Genie", description: "Spin up production-ready repos in minutes." },
      { title: "Live Test Lab", description: "Run tests, capture logs, visualize metrics." },
    ]);
    setLoading(false);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-8 md:grid-cols-2">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Theme</label>
            <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="FinTech, Health, AI..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Team Members</label>
              <Input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="e.g. 3" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Difficulty</label>
              <Input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="Beginner/Pro" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Duration</label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 24h" />
          </div>
          <Button onClick={generateIdeas} className="rounded-2xl">Generate Ideas</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Generated Ideas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <TypingSkeleton />
          ) : (
            <div className="space-y-3">
              {ideas.map((idea, idx) => (
                <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="rounded-xl border border-border/50 p-3">
                  <div className="mb-1 text-sm font-medium text-foreground">{idea.title}</div>
                  <div className="text-xs text-muted-foreground">{idea.description}</div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" className="rounded-xl">Pin Idea</Button>
                    <Button size="sm" variant="outline" className="rounded-xl">Refine Idea</Button>
                    <Button size="sm" asChild className="rounded-xl">
                      <Link href="/repo-builder">Send to Repo Builder</Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TypingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <motion.div key={i} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }} className="h-16 rounded-xl bg-muted" />
      ))}
    </div>
  );
}


