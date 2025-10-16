"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TerminalLog } from "@/components/terminal-log";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export default function LiveTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ pass: 0, fail: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      setLogs((prev) => [...prev, `log ${prev.length + 1}`]);
      setProgress((p) => Math.min(100, p + 2));
      if (Math.random() > 0.8) setResults((r) => ({ ...r, fail: r.fail + 1 }));
      else setResults((r) => ({ ...r, pass: r.pass + 1 }));
    }, 300);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Test progress</div>
        <div className="flex gap-2">
          <Button variant="secondary" className="rounded-xl">Rebuild</Button>
          <Button className="rounded-xl">View Output</Button>
        </div>
      </div>
      <Progress value={progress} className="mb-4" />

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="logs" className="mt-4">
          <TerminalLog lines={logs} height={360} />
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Passed: {results.pass} • Failed: {results.fail}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="metrics" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">CPU/Memory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="h-24 rounded-xl bg-card p-3">CPU: ▂▃▅▆▃▂</div>
                <div className="h-24 rounded-xl bg-card p-3">Mem: ▂▂▃▆▅▃</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


