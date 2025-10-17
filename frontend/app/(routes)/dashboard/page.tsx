"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Cog, FlaskConical, Mic, Loader2, ArrowRight, Trash2, Save, Rocket } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type HackathonResult = {
  success: boolean;
  message: string;
  generated_content?: any[]; // make this optional and flexible
  metadata?: {
    idea: string;
    timestamp: string;
    agents_used: number;
    processing_time: string;
  };
};

export default function DashboardPage() {
  const [idea, setIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HackathonResult | null>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedResult = localStorage.getItem('hackathon-result');
    if (savedResult) {
      try {
        const parsedResult = JSON.parse(savedResult);
        setResult(parsedResult);
        console.log('Loaded saved result:', parsedResult);
      } catch (e) {
        console.error('Failed to parse saved result:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (result && mounted) {
      try {
        localStorage.setItem('hackathon-result', JSON.stringify(result));
        console.log('Saved result to localStorage:', result);
      } catch (e) {
        console.error('Failed to save result to localStorage:', e);
      }
    }
  }, [result, mounted]);

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

  // Safe accessor: always an array (possibly empty)
  const gen = result?.generated_content ?? [];
  const deploymentUrl = gen[3]?.deployment_url ?? null;

  const handleStartProject = async () => {
    if (!idea.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/start-hackathon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        console.log('Hackathon result:', data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || 'Failed to start hackathon');
        console.error('Failed to start hackathon:', errorData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResults = () => {
    setResult(null);
    setError(null);
    try {
      localStorage.removeItem('hackathon-result');
    } catch (e) {
      console.error('Failed to remove localStorage key', e);
    }
    console.log('Cleared all results');
  };

  const handleDeployToVercel = async () => {
    if (!result) return;

    try {
      const projectName = idea.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const response = await fetch('/api/deploy-to-vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      });

      if (response.ok) {
        const deploymentResult = await response.json();

        alert(`🚀 Deployment triggered successfully!\n\nURL: ${deploymentResult.deployment_url}\n\nYour project is being deployed to Vercel!`);

        // Build a safe copy of generated_content
        const currentGen = result.generated_content ? [...result.generated_content] : [];

        // Ensure index 3 exists (we'll set/overwrite it)
        currentGen[3] = {
          ...(currentGen[3] ?? {}),
          deployment_url: deploymentResult.deployment_url,
          deployment_status: 'deployed',
          build_logs: deploymentResult.build_logs ?? [],
          environment_variables: deploymentResult.environment_variables ?? {},
          monitoring: deploymentResult.monitoring ?? {}
        };

        const updatedResult: HackathonResult = {
          ...result,
          generated_content: currentGen
        };

        setResult(updatedResult);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to deploy: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Deployment error:', err);
      alert('Failed to trigger deployment. Please try again.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="mb-8">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-3 text-2xl font-semibold text-foreground">
          🚀 Build your Hackathon Project in Minutes
        </motion.h1>

        <div className="mb-6">
          <div className="flex gap-4 max-w-2xl">
            <Input
              placeholder="Enter your project idea (e.g., AI recipe generator web app)"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleStartProject()}
            />
            <Button onClick={handleStartProject} disabled={!idea.trim() || isLoading} size="lg" className="px-6">
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

        {error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
            <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <h2 className="text-xl font-bold mb-2 text-red-700 dark:text-red-300">❌ Error</h2>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={() => setError(null)} variant="outline" className="rounded-xl border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30">
                Dismiss
              </Button>
            </Card>
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">🎉 Your Hackathon Project is Ready!</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Save className="h-4 w-4" />
                    <span>Saved</span>
                  </div>
                  <Button onClick={handleClearResults} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Generated Ideas */}
              {Array.isArray(gen[0]) && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-green-600" />
                    Generated Project Ideas
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(gen[0] as any[]).map((ideaItem, index) => (
                      <Card key={index} className="p-4">
                        <h4 className="font-semibold text-lg mb-2">{ideaItem?.title ?? 'Untitled'}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{ideaItem?.pitch ?? ''}</p>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-blue-600">Tech Stack:</span>
                            <p className="text-xs text-muted-foreground">{ideaItem?.tech ?? '—'}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-purple-600">Novelty:</span>
                            <p className="text-xs text-muted-foreground">{ideaItem?.novelty ?? '—'}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Research / Technical Requirements / Timeline */}
              {gen[1] && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-blue-600" />
                    Market Research & Analysis
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {gen[1].market_analysis && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Market Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Target Audience:</span>
                            <p className="text-muted-foreground">{gen[1].market_analysis.target_audience ?? '—'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Market Size:</span>
                            <p className="text-muted-foreground">{gen[1].market_analysis.market_size ?? '—'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Competition:</span>
                            <p className="text-muted-foreground">{gen[1].market_analysis.competition ?? '—'}</p>
                          </div>
                        </div>
                      </Card>
                    )}
                    {gen[1].technical_requirements && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Technical Requirements</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Scalability:</span>
                            <p className="text-muted-foreground">{gen[1].technical_requirements.scalability ?? '—'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Security:</span>
                            <p className="text-muted-foreground">{gen[1].technical_requirements.security ?? '—'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Performance:</span>
                            <p className="text-muted-foreground">{gen[1].technical_requirements.performance ?? '—'}</p>
                          </div>
                        </div>
                      </Card>
                    )}
                    {gen[1].project_timeline && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Project Timeline</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Phase 1:</span>
                            <p className="text-muted-foreground">{gen[1].project_timeline.phase1 ?? '—'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Phase 2:</span>
                            <p className="text-muted-foreground">{gen[1].project_timeline.phase2 ?? '—'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Phase 3:</span>
                            <p className="text-muted-foreground">{gen[1].project_timeline.phase3 ?? '—'}</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Code Files */}
              {Array.isArray(gen[2]?.files) && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Cog className="h-5 w-5 text-purple-600" />
                    Generated Code Files
                  </h3>
                  <div className="space-y-3">
                    {gen[2].files.map((file: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-mono text-sm font-semibold">{file.path ?? 'unknown'}</h4>
                          <span className="text-xs text-muted-foreground">
                            {(file.content?.split('\n').length) ?? 0} lines
                          </span>
                        </div>
                        <div className="bg-muted rounded-lg p-3 max-h-32 overflow-y-auto">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {file.content?.substring(0, 300) ?? ''}
                            {file.content && file.content.length > 300 && '...'}
                          </pre>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Presentation Materials */}
              {Array.isArray(gen[4]?.slides_outline) && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Mic className="h-5 w-5 text-pink-600" />
                    Presentation Materials
                  </h3>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Slides Outline</h4>
                    <div className="space-y-2">
                      {gen[4].slides_outline.map((slide: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium text-pink-600 min-w-[2rem]">{index + 1}.</span>
                          <div>
                            <h5 className="font-medium text-sm">{slide.title ?? 'Untitled'}</h5>
                            <p className="text-xs text-muted-foreground">{slide.content ?? ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Button asChild className="rounded-xl">
                  <Link href="/idea-studio">
                    <Brain className="mr-2 h-4 w-4" />
                    View Ideas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/repo-builder">
                    <Cog className="mr-2 h-4 w-4" />
                    View Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/live-test">
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Test Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/ai-presenter">
                    <Mic className="mr-2 h-4 w-4" />
                    Create Presentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {deploymentUrl ? (
                  <Button asChild variant="outline" className="rounded-xl">
                    <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                      <Rocket className="mr-2 h-4 w-4" />
                      View Live Site
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button onClick={handleDeployToVercel} variant="outline" className="rounded-xl">
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy to Vercel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
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
              <CardContent className="text-sm text-muted-foreground">Quick access</CardContent>
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
                <li key={i} className="rounded-xl border border-border/50 bg-background/40 p-3">{a}</li>
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
