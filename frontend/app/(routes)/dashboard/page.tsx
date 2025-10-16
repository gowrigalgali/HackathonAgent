"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Cog, FlaskConical, Mic } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const shortcuts = [
    { title: "Idea Studio", href: "/idea-studio", icon: Brain },
    { title: "Repo Builder", href: "/repo-builder", icon: Cog },
    { title: "Live Test", href: "/live-test", icon: FlaskConical },
    { title: "AI Presenter", href: "/ai-presenter", icon: Mic },
  ];

  const activity = [
    "Created repo hackathon-agent-ui",
    "Generated 3 ideas for FinTech",
    "Ran tests: 12 passed, 1 failed",
    "Rendered demo.mp4 (00:37)",
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-3 text-2xl font-semibold text-foreground"
        >
          🚀 Build your Hackathon Project in Minutes
        </motion.h1>
        <Link href="/repo-builder">
          <Button size="lg" className="rounded-2xl bg-primary px-6 text-sm">
            Start a New Project
          </Button>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map(({ title, href, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="rounded-2xl bg-card transition-colors hover:bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={18} />
                  </span>
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Quick access
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {activity.map((a, i) => (
                <li key={i} className="rounded-xl border border-border/50 bg-background/40 p-3">
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use Idea Studio to explore multiple themes and pin favorites.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


