"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2, Download, Play, Share2, FileText, Video, ExternalLink } from "lucide-react";

type PresentationData = {
  slides_outline: string[];
  pitch: string;
  demo_script: string;
  resources: string[];
  slides_link?: string;
};

export default function AIPresenterPage() {
  const [projectTitle, setProjectTitle] = useState("");
  const [voice, setVoice] = useState("gemini");
  const [tone, setTone] = useState("energetic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generatePresentation = async () => {
    if (!projectTitle.trim()) return;
    
    setIsGenerating(true);
    setProgress(0);
    setPresentationData(null);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    try {
      const response = await fetch('/api/start-hackathon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idea: projectTitle.trim(),
          presentation: true
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract presentation agent output
        if (data.generated_content && data.generated_content.length > 0) {
          const presentationContent = data.generated_content.find((content: unknown) => 
            content && typeof content === 'object' && 'slides_outline' in content && 'pitch' in content
          ) as PresentationData | undefined;
          
          if (presentationContent) {
            setPresentationData(presentationContent);
            setProgress(100);
          }
        }
      } else {
        console.error('Failed to generate presentation');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
      clearInterval(progressInterval);
    }
  };

  const renderVideo = async () => {
    if (!presentationData) return;
    
    setIsRendering(true);
    setProgress(0);
    
    // Simulate video rendering progress
    const renderSteps = [
      "Preparing slides...",
      "Generating voiceover...",
      "Syncing audio with visuals...",
      "Rendering video...",
      "Optimizing output..."
    ];
    
    for (let i = 0; i < renderSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress((i + 1) * 20);
    }
    
    // Simulate video URL
    setVideoUrl(`https://presentation-videos.example.com/${projectTitle.toLowerCase().replace(/\s+/g, '-')}.mp4`);
    setIsRendering(false);
  };

  const downloadPresentation = () => {
    if (!presentationData) return;
    
    const content = `# ${projectTitle} - Presentation

## Pitch
${presentationData.pitch}

## Slides Outline
${presentationData.slides_outline.map((slide, index) => `${index + 1}. ${slide}`).join('\n')}

## Demo Script
${presentationData.demo_script}

## Resources
${presentationData.resources.map(resource => `- ${resource}`).join('\n')}
`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle}-presentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">🎤 AI Presenter</h1>
        <p className="text-muted-foreground">Create compelling presentations and demo videos for your hackathon project</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Presentation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Project Title</label>
              <Input 
                value={projectTitle} 
                onChange={(e) => setProjectTitle(e.target.value)} 
                placeholder="e.g., AI Recipe Generator"
                className="text-base"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Voice</label>
                <select 
                  value={voice} 
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="gemini">Gemini Voice</option>
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="azure">Azure Speech</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Tone</label>
                <select 
                  value={tone} 
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="energetic">Energetic</option>
                  <option value="calm">Calm</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
            </div>
            
            <Button 
              onClick={generatePresentation} 
              disabled={!projectTitle.trim() || isGenerating}
              className="w-full rounded-2xl h-12 text-base"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Presentation...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Presentation
                </>
              )}
            </Button>
            
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div 
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {presentationData ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Pitch</h3>
                  <p className="text-sm text-muted-foreground">{presentationData.pitch}</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Slides Outline</h3>
                  <div className="space-y-1">
                    {presentationData.slides_outline.slice(0, 5).map((slide, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {index + 1}. {slide}
                      </div>
                    ))}
                    {presentationData.slides_outline.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        ... and {presentationData.slides_outline.length - 5} more slides
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={renderVideo}
                    disabled={isRendering}
                    className="rounded-xl"
                  >
                    {isRendering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rendering...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4" />
                        Render MP4
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={downloadPresentation}
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Generate a presentation to see the preview here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generated Content Display */}
      {presentationData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Complete Presentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slides */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Slides Outline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presentationData.slides_outline.map((slide, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{slide}</h4>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Demo Script */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Demo Script</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-sm text-foreground whitespace-pre-wrap">{presentationData.demo_script}</pre>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presentationData.resources.map((resource, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{resource}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                {videoUrl ? (
                  <Button asChild className="rounded-xl">
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="mr-2 h-4 w-4" />
                      Play Video
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button 
                    onClick={renderVideo}
                    disabled={isRendering}
                    className="rounded-xl"
                  >
                    {isRendering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rendering Video...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4" />
                        Render MP4
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={downloadPresentation}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Presentation
                </Button>
                
                <Button 
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    const shareText = `Check out my hackathon project: ${projectTitle}\n\n${presentationData.pitch}\n\nDemo: ${videoUrl || 'Coming soon!'}`;
                    navigator.clipboard.writeText(shareText);
                    alert('Presentation details copied to clipboard!');
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share to Repo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}