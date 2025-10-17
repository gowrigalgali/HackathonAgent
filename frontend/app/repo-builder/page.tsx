"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Github, ExternalLink, Copy, Check, Download, Play } from "lucide-react";

type GeneratedFile = {
  path: string;
  content: string;
};

type GeneratedCode = {
  files: GeneratedFile[];
  readme: string;
  requirements: string[];
};

export default function RepoBuilderPage() {
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load persisted code from localStorage
    const savedCode = localStorage.getItem('hackathon-code');
    const savedResult = localStorage.getItem('hackathon-result');
    
    if (savedCode) {
      try {
        const parsedCode = JSON.parse(savedCode);
        setGeneratedCode(parsedCode);
        console.log('Loaded saved code:', parsedCode);
      } catch (e) {
        console.error('Failed to parse saved code:', e);
      }
    } else if (savedResult) {
      // Try to load code from main hackathon result
      try {
        const parsedResult = JSON.parse(savedResult);
        if (parsedResult.generated_content && parsedResult.generated_content[2]) {
          setGeneratedCode(parsedResult.generated_content[2]);
          console.log('Loaded code from hackathon result:', parsedResult.generated_content[2]);
        }
      } catch (e) {
        console.error('Failed to parse saved result:', e);
      }
    }
  }, []);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    if (generatedCode && mounted) {
      localStorage.setItem('hackathon-code', JSON.stringify(generatedCode));
      console.log('Saved code to localStorage:', generatedCode);
    }
  }, [generatedCode, mounted]);

  // Get idea from URL params
  useEffect(() => {
    if (mounted) {
      const urlParams = new URLSearchParams(window.location.search);
      const idea = urlParams.get('idea');
      const pitch = urlParams.get('pitch');
      if (idea) {
        setRepoName(idea.toLowerCase().replace(/\s+/g, '-'));
        setDescription(pitch || `A ${idea} project`);
      }
    }
  }, [mounted]);

  const generateCodebase = async () => {
    if (!repoName.trim()) return;
    
    setIsGenerating(true);
    setConsoleLogs([]);
    setGeneratedCode(null);
    setGithubUrl("");
    
    // Simulate console output
    const logs = [
      "🚀 Starting codebase generation...",
      "🧠 Analyzing project requirements...",
      "💻 Generating project structure...",
      "📝 Creating documentation...",
      "🔧 Setting up dependencies...",
      "✅ Codebase generation complete!"
    ];
    
    logs.forEach((log, index) => {
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, log]);
      }, index * 1000);
    });
    
    try {
      const response = await fetch('/api/start-hackathon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idea: repoName.trim(),
          description: description,
          visibility: visibility
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract coding agent output
        if (data.generated_content && data.generated_content.length > 0) {
          const codingContent = data.generated_content.find((content: unknown) => 
            content && typeof content === 'object' && 'files' in content && Array.isArray((content as {files: unknown}).files)
          ) as GeneratedCode | undefined;
          
          if (codingContent) {
            setGeneratedCode(codingContent);
            
            // Simulate GitHub repo creation
            setTimeout(() => {
              setGithubUrl(`https://github.com/user/${repoName.toLowerCase().replace(/\s+/g, '-')}`);
              setConsoleLogs(prev => [...prev, `🔗 GitHub repository created: ${githubUrl}`]);
            }, 6000);
          }
        }
      } else {
        console.error('Failed to generate codebase');
        setConsoleLogs(prev => [...prev, "❌ Failed to generate codebase"]);
      }
    } catch (error) {
      console.error('Error:', error);
      setConsoleLogs(prev => [...prev, "❌ Error generating codebase"]);
    } finally {
      setIsGenerating(false);
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

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const createGitHubRepo = async () => {
    if (!generatedCode) {
      alert('Please generate code first before creating a repository.');
      return;
    }

    try {
      setConsoleLogs(prev => [...prev, `🚀 Creating GitHub repository: ${repoName}`]);
      
      const response = await fetch('/api/create-github-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: description,
          files: generatedCode.files,
          private: visibility === 'private'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        setConsoleLogs(prev => [...prev, `✅ Repository created successfully`]);
        setConsoleLogs(prev => [...prev, `📁 Added ${generatedCode.files.length} files`]);
        setConsoleLogs(prev => [...prev, `📝 Created initial commit`]);
        setConsoleLogs(prev => [...prev, `🎉 Repository ready at: ${result.repository_url}`]);
        
        // Set the GitHub URL
        setGithubUrl(result.repository_url);
        
        // Show success message
        alert(`✅ GitHub repository created successfully!\n\nRepository: ${result.repository_url}\n\nYou can now view your repository on GitHub!`);
        
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setConsoleLogs(prev => [...prev, `❌ Error: ${errorData.error}`]);
        alert(`Failed to create GitHub repository: ${errorData.error}`);
      }
      
    } catch (error) {
      console.error('Error creating GitHub repository:', error);
      setConsoleLogs(prev => [...prev, `❌ Network error: ${error}`]);
      alert('Failed to create GitHub repository. Please check your connection and try again.');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">⚙️ Repo Builder</h1>
        <p className="text-muted-foreground">Generate complete codebases and deploy them to GitHub</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Repository Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Repository Name</label>
              <Input 
                value={repoName} 
                onChange={(e) => setRepoName(e.target.value)} 
                placeholder="e.g., ai-recipe-generator"
                className="text-base"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief description of your project"
                className="text-base"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Visibility</label>
              <select 
                value={visibility} 
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <Button 
              onClick={generateCodebase} 
              disabled={!repoName.trim() || isGenerating}
              className="w-full rounded-2xl h-12 text-base"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Codebase...
                </>
              ) : (
                <>
                  Generate Codebase
                  <Github className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Console Output */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Live Console</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {consoleLogs.length === 0 ? (
                <div className="text-gray-500">Waiting for generation to start...</div>
              ) : (
                consoleLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-1"
                  >
                    <span className="text-green-400">[{(new Date()).toLocaleTimeString()}]</span> {log}
                  </motion.div>
                ))
              )}
              {isGenerating && (
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-blue-400"
                >
                  Generating...
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Code Display */}
      {generatedCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Generated Codebase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* File Tree */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Project Structure:</h3>
                  <div className="bg-muted rounded-lg p-3 font-mono text-sm">
                    {generatedCode.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-foreground">📄 {file.path}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(file.content, `file-${index}`)}
                          >
                            {copiedStates[`file-${index}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadFile(file.path, file.content)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* README Preview */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">README.md:</h3>
                  <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-foreground whitespace-pre-wrap">{generatedCode.readme}</pre>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Dependencies:</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedCode.requirements.map((req, index) => (
                      <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4 border-t">
                  {githubUrl ? (
                    <Button asChild className="rounded-xl">
                      <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2 h-4 w-4" />
                        View on GitHub
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button onClick={createGitHubRepo} className="rounded-xl">
                      <Github className="mr-2 h-4 w-4" />
                      Create GitHub Repo
                    </Button>
                  )}
                  
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/live-test">
                      <Play className="mr-2 h-4 w-4" />
                      Go to Live Test
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="rounded-xl"
                    onClick={() => {
                      const allFiles = generatedCode.files.map(f => `# ${f.path}\n\n${f.content}`).join('\n\n---\n\n');
                      downloadFile(`${repoName}-codebase.txt`, allFiles);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download All Files
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}