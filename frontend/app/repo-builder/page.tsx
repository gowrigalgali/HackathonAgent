"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { TerminalLog } from "@/components/terminal-log";

export default function RepoBuilderPage() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const generate = async () => {
    setDone(false);
    setLogs([]);
    const steps = [
      "Initializing project...",
      "Generating file structure...",
      "Installing dependencies...",
      "Creating GitHub repository...",
      "Pushing initial commit...",
    ];
    for (const s of steps) {
      setLogs((prev) => [...prev, s]);
      // simulate work
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500));
    }
    setLogs((prev) => [...prev, "Done!"]);
    setDone(true);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-8 md:grid-cols-2">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Repo Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="hackathon-agent" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Description</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description" />
          </div>
          <div className="flex gap-3 text-sm">
            <button
              className={`rounded-xl border px-3 py-1.5 ${visibility === "public" ? "bg-primary/15" : "bg-transparent"}`}
              onClick={() => setVisibility("public")}
            >
              Public
            </button>
            <button
              className={`rounded-xl border px-3 py-1.5 ${visibility === "private" ? "bg-primary/15" : "bg-transparent"}`}
              onClick={() => setVisibility("private")}
            >
              Private
            </button>
          </div>
          <Button className="rounded-2xl" onClick={generate}>Generate Codebase</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Console</CardTitle>
        </CardHeader>
        <CardContent>
          <TerminalLog lines={logs} height={260} />
          {done && (
            <div className="mt-4 flex items-center justify-between">
              <Link href="https://github.com/gowrigalgali/HackathonAgent" className="text-sm text-primary underline">
                View GitHub Repo
              </Link>
              <Button asChild className="rounded-xl" variant="secondary">
                <Link href="/live-test">Go to Live Test</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


