"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Github, ExternalLink, Copy, Check } from "lucide-react";

type Idea = { 
  title: string; 
  pitch: string; 
  tech: string; 
  novelty: string;
};

export default function IdeaStudioPage() {
  const [theme, setTheme] = useState("");
  const [members, setMembers] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [generatedContent, setGeneratedContent] = useState<{generated_content?: unknown[]} | null>(null);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  const generateIdeas = async () => {
    if (!theme.trim()) return;
    
    setLoading(true);
    setIdeas([]);
    setGeneratedContent(null);
    
    try {
      const response = await fetch('/api/start-hackathon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idea: theme.trim(),
          teamMembers: members,
          difficulty: difficulty,
          duration: duration
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data);
        
        // Extract ideas from the generated content
        if (data.generated_content && data.generated_content.length > 0) {
          const ideationContent = data.generated_content[0];
          if (Array.isArray(ideationContent)) {
            setIdeas(ideationContent);
          }
        }
      } else {
        console.error('Failed to generate ideas');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const createGitHubRepo = async (idea: Idea) => {
    // This would integrate with GitHub API to create a repository
    // For now, we'll show a placeholder
    alert(`Creating GitHub repository for "${idea.title}"...\n\nThis would:\n1. Create a new GitHub repository\n2. Initialize with README\n3. Set up basic project structure\n4. Return the repository URL`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">🧠 Idea Studio</h1>
        <p className="text-muted-foreground">Generate creative hackathon project ideas and turn them into reality</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Project Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Project Theme/Idea</label>
              <Input 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)} 
                placeholder="e.g., AI recipe generator, smart home dashboard, fitness tracker..."
                className="text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Team Size</label>
                <Input 
                  value={members} 
                  onChange={(e) => setMembers(e.target.value)} 
                  placeholder="e.g., 3"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Difficulty</label>
                <Input 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)} 
                  placeholder="Beginner/Intermediate/Advanced"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Duration</label>
              <Input 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)} 
                placeholder="e.g., 24h, 48h, 1 week"
              />
            </div>
            <Button 
              onClick={generateIdeas} 
              disabled={!theme.trim() || loading}
              className="w-full rounded-2xl h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  Generate Ideas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Ideas Panel */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Generated Ideas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <TypingSkeleton />
            ) : ideas.length > 0 ? (
              <div className="space-y-4">
                {ideas.map((idea, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: idx * 0.1 }} 
                    className="rounded-xl border border-border/50 bg-card/50 p-4"
                  >
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{idea.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{idea.pitch}</p>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-primary">Tech Stack:</span>
                          <p className="text-xs text-muted-foreground">{idea.tech}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-primary">Novelty:</span>
                          <p className="text-xs text-muted-foreground">{idea.novelty}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="rounded-xl"
                        onClick={() => copyToClipboard(idea.pitch, `pitch-${idx}`)}
                      >
                        {copiedStates[`pitch-${idx}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy Pitch
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-xl"
                        onClick={() => createGitHubRepo(idea)}
                      >
                        <Github className="h-3 w-3 mr-1" />
                        Create Repo
                      </Button>
                      <Button 
                        size="sm" 
                        asChild 
                        className="rounded-xl"
                      >
                        <Link href={`/repo-builder?idea=${encodeURIComponent(idea.title)}&pitch=${encodeURIComponent(idea.pitch)}`}>
                          Build Project
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Enter a project theme above and click &quot;Generate Ideas&quot; to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Pipeline Results */}
      {generatedContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Complete Pipeline Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
              
              <div className="flex gap-4">
                <Button asChild className="rounded-xl">
                  <Link href="/repo-builder">
                    View Generated Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/live-test">
                    Test Deployment
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/ai-presenter">
                    Create Presentation
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function TypingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0.4 }} 
          animate={{ opacity: 1 }} 
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }} 
          className="h-32 rounded-xl bg-muted" 
        />
      ))}
    </div>
  );
}