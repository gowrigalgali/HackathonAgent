"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function AIPresenterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [voice, setVoice] = useState("Gemini");
  const [tone, setTone] = useState("energetic");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const render = async () => {
    setDone(false);
    setProgress(0);
    for (let i = 0; i <= 100; i += 5) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 120));
      setProgress(i);
    }
    setDone(true);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-8 md:grid-cols-2">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Slides & Voice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Upload slides</label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Voice</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gemini">Gemini</SelectItem>
                  <SelectItem value="ElevenLabs">ElevenLabs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="rounded-2xl" onClick={render} disabled={!file}>Render MP4</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Progress & Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-3" />
          <div className="aspect-video w-full rounded-xl border border-border bg-black/60" />
          {done && (
            <div className="mt-3 flex items-center justify-between">
              <Button variant="secondary" className="rounded-xl">Download / Play</Button>
              <Button className="rounded-xl">Share to Repo</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


