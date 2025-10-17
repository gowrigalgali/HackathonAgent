"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Cog, FlaskConical, Mic, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [idea, setIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

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

  const handleStartProject = async () => {
    if (!idea.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/start-hackathon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        console.log('Hackathon result:', data);
      } else {
        console.error('Failed to start hackathon');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        
        {/* Project Input */}
        <div className="mb-6">
          <div className="flex gap-4 max-w-2xl">
            <Input
              placeholder="Enter your project idea (e.g., AI recipe generator web app)"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleStartProject()}
            />
            <Button 
              onClick={handleStartProject}
              disabled={!idea.trim() || isLoading}
              size="lg"
              className="px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Start Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">🎉 Your Hackathon Project is Ready!</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-semibold text-green-700 dark:text-green-300">✅ Ideation</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">Project ideas generated</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">✅ Research</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Research and planning completed</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="font-semibold text-purple-700 dark:text-purple-300">✅ Coding</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Codebase generated</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h3 className="font-semibold text-orange-700 dark:text-orange-300">✅ Deployment</h3>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Deployment configured</p>
                </div>
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <h3 className="font-semibold text-pink-700 dark:text-pink-300">✅ Presentation</h3>
                  <p className="text-sm text-pink-600 dark:text-pink-400">Presentation materials created</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
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


