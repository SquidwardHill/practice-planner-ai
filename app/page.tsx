"use client";

import { useState } from "react";

interface PracticeBlock {
  time_slot: string;
  drill_name: string;
  category: string;
  duration: number;
  notes: string;
}

interface PracticePlan {
  practice_title: string;
  total_duration_minutes: number;
  blocks: PracticeBlock[];
}

export default function Home() {
  const [practicePlan, setPracticePlan] = useState<PracticePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPracticePlan(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate practice plan");
      }

      // Handle streamed response - this keeps connection alive during generation
      // and prevents Vercel timeout (10s limit for blocking calls)
      // streamObject.toTextStreamResponse() streams the JSON text progressively
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let jsonText = "";

      if (!reader) {
        throw new Error("No response body");
      }

      // Read the stream - this keeps the connection alive during generation
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        jsonText += decoder.decode(value, { stream: true });
      }

      // Parse the complete JSON once the stream finishes
      const data = JSON.parse(jsonText) as PracticePlan;
      setPracticePlan(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Practice Planner AI
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Generate structured basketball practice plans with AI
          </p>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Practice Request
              </label>
              <textarea
                id="prompt"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Example: Create a 90-minute varsity basketball practice focusing on transition defense and conditioning."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                rows={4}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? "Generating..." : "Generate Practice Plan"}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 animate-pulse">
            <div className="mb-6">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-4 w-32 bg-gray-100 dark:bg-gray-600 rounded" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-r-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="h-5 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
                        <span className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
                        <span className="h-4 w-10 bg-gray-200 dark:bg-gray-600 rounded" />
                      </div>
                      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-600 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-500 rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {practicePlan && !isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {practicePlan.practice_title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Total Duration: {practicePlan.total_duration_minutes} minutes
              </p>
            </div>

            <div className="space-y-4">
              {practicePlan.blocks.map((block, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                          {block.time_slot}
                        </span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                          {block.category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {block.duration} min
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {block.drill_name}
                      </h3>
                    </div>
                  </div>
                  {block.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {block.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
