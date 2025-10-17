"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Play, RotateCcw, ExternalLink, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type TestResult = {
  name: string;
  status: 'pass' | 'fail' | 'running';
  duration: number;
  output?: string;
};

type Metric = {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
};

export default function LiveTestPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'tests' | 'metrics'>('logs');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [deploymentUrl, setDeploymentUrl] = useState("");

  useEffect(() => {
    // Initialize with some sample data
    setLogs([
      "[2024-01-15 10:30:15] 🚀 Starting deployment process...",
      "[2024-01-15 10:30:16] 📦 Building application...",
      "[2024-01-15 10:30:18] ✅ Build completed successfully",
      "[2024-01-15 10:30:19] 🌐 Deploying to production...",
      "[2024-01-15 10:30:22] ✅ Deployment successful!"
    ]);

    setTestResults([
      { name: "Unit Tests", status: 'pass', duration: 1.2 },
      { name: "Integration Tests", status: 'pass', duration: 3.4 },
      { name: "API Tests", status: 'pass', duration: 2.1 },
      { name: "UI Tests", status: 'fail', duration: 5.6, output: "Button click test failed" },
    ]);

    setMetrics([
      { name: "CPU Usage", value: 45, unit: "%", status: 'good' },
      { name: "Memory Usage", value: 78, unit: "%", status: 'warning' },
      { name: "Response Time", value: 120, unit: "ms", status: 'good' },
      { name: "Error Rate", value: 0.1, unit: "%", status: 'good' },
    ]);

    setDeploymentUrl("https://ai-recipe-generator.example.com");
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setLogs(prev => [...prev, "[2024-01-15 10:35:00] 🧪 Starting test suite..."]);
    
    // Simulate test execution
    const testNames = ["Unit Tests", "Integration Tests", "API Tests", "UI Tests", "Performance Tests"];
    const newTestResults: TestResult[] = [];
    
    for (let i = 0; i < testNames.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status = Math.random() > 0.2 ? 'pass' : 'fail';
      const duration = Math.random() * 5 + 1;
      
      newTestResults.push({
        name: testNames[i],
        status: status as 'pass' | 'fail',
        duration: parseFloat(duration.toFixed(1))
      });
      
      setLogs(prev => [...prev, `[2024-01-15 10:35:${10+i}] ${status === 'pass' ? '✅' : '❌'} ${testNames[i]} ${status === 'pass' ? 'passed' : 'failed'} (${duration.toFixed(1)}s)`]);
    }
    
    setTestResults(newTestResults);
    setLogs(prev => [...prev, "[2024-01-15 10:35:15] 🎉 Test suite completed!"]);
    setIsRunning(false);
  };

  const rebuildProject = async () => {
    setIsRunning(true);
    setLogs(prev => [...prev, "[2024-01-15 10:40:00] 🔄 Starting rebuild process..."]);
    
    // Simulate rebuild
    const rebuildSteps = [
      "Cleaning previous build...",
      "Installing dependencies...",
      "Compiling TypeScript...",
      "Building frontend assets...",
      "Optimizing bundle...",
      "Deploying to staging...",
      "Running smoke tests...",
      "Deploying to production..."
    ];
    
    for (let i = 0; i < rebuildSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setLogs(prev => [...prev, `[2024-01-15 10:40:${5+i}] ${rebuildSteps[i]}`]);
    }
    
    setLogs(prev => [...prev, "[2024-01-15 10:40:13] ✅ Rebuild completed successfully!"]);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">🧪 Live Test</h1>
        <p className="text-muted-foreground">Test, monitor, and deploy your hackathon project in real-time</p>
      </div>

      {/* Control Panel */}
      <Card className="rounded-2xl mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="rounded-xl"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Tests
                </>
              )}
            </Button>
            
            <Button 
              onClick={rebuildProject} 
              disabled={isRunning}
              variant="outline"
              className="rounded-xl"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Rebuild Project
            </Button>
            
            {deploymentUrl && (
              <Button asChild variant="outline" className="rounded-xl">
                <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Live App
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'logs', label: 'Logs', icon: '📋' },
          { id: 'tests', label: 'Test Results', icon: '🧪' },
          { id: 'metrics', label: 'Metrics', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'logs' | 'tests' | 'metrics')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Live Logs</h3>
              <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-1 text-green-400"
                  >
                    {log}
                  </motion.div>
                ))}
                {isRunning && (
                  <motion.div
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-blue-400"
                  >
                    Processing...
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <div className="space-y-3">
                {testResults.map((test, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        {test.output && (
                          <div className="text-sm text-muted-foreground">{test.output}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {test.duration}s
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Overall Status:</span>
                  <div className="flex items-center space-x-2">
                    {testResults.every(t => t.status === 'pass') ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-500 font-medium">All Tests Passed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-500 font-medium">Some Tests Failed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-muted rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{metric.name}</span>
                      <span className={`text-lg font-bold ${getMetricColor(metric.status)}`}>
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          metric.status === 'good' ? 'bg-green-500' :
                          metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(metric.value, 100)}%` }}
                      ></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-4">
        <Button asChild className="rounded-xl">
          <Link href="/ai-presenter">
            Create Presentation
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard">
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}