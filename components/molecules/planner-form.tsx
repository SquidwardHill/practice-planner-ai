"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H2, P, Small } from "@/components/atoms/typography";

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

export function PlannerForm() {
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
        const errorText = await response.text();
        let errorMessage = "Failed to generate practice plan";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.details || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let jsonText = "";

      if (!reader) {
        throw new Error("No response body");
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            jsonText += decoder.decode(value, { stream: true });
          }
        }

        jsonText += decoder.decode();

        if (!jsonText.trim()) {
          throw new Error(
            "Empty response from server - the stream completed but no data was received"
          );
        }

        let data: PracticePlan;
        try {
          data = JSON.parse(jsonText) as PracticePlan;
        } catch (parseError) {
          console.error(
            "JSON parse error:",
            parseError,
            "Received text:",
            jsonText
          );
          throw new Error(
            "The response was incomplete. This may happen if the generation takes too long. Please try again with a shorter practice duration or simpler request."
          );
        }

        if (
          !data.practice_title ||
          !data.blocks ||
          !Array.isArray(data.blocks)
        ) {
          throw new Error("Invalid response format from server");
        }

        setPracticePlan(data);
      } catch (streamError) {
        if (streamError instanceof Error) {
          throw streamError;
        }
        throw new Error("Failed to read stream response");
      }
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
    <div className="space-y-6">
      <div className="p-6 border rounded-lg">
        <div className="mb-4">
          <H2 className="mb-1">Generate Practice Plan</H2>
          <P className="text-muted-foreground">
            Create a custom practice plan based on your preferences
          </P>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Practice Request</Label>
              <textarea
                id="prompt"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Example: Create a 90-minute varsity basketball practice focusing on transition defense and conditioning."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground dark:bg-input/30 transition-[color,box-shadow] focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={4}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="default"
              disabled={isLoading || !input.trim()}
              className="w-full"
            >
              {isLoading ? "Generating..." : "Generate Practice Plan"}
            </Button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
          <Small className="text-destructive">{error}</Small>
        </div>
      )}

      {isLoading && (
        <div className="p-6 border rounded-lg">
          <div className="space-y-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="border-l-4 border-primary/20 pl-4 py-3 bg-muted/30 rounded-r-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="h-5 w-24 bg-muted rounded" />
                        <span className="h-4 w-16 bg-muted rounded" />
                        <span className="h-4 w-10 bg-muted rounded" />
                      </div>
                      <div className="h-5 w-40 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {practicePlan && !isLoading && (
        <div className="p-6 border rounded-lg">
          <div className="mb-4">
            <H2 className="mb-1">{practicePlan.practice_title}</H2>
            <P className="text-muted-foreground">
              Total Duration: {practicePlan.total_duration_minutes} minutes
            </P>
          </div>
          <div>
            <div className="space-y-4">
              {practicePlan.blocks.map((block, index) => (
                <div
                  key={index}
                  className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-base font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                          {block.time_slot}
                        </span>
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                          {block.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {block.duration} min
                        </span>
                      </div>
                      <P className="font-medium">{block.drill_name}</P>
                    </div>
                  </div>
                  {block.notes && (
                    <Small className="text-muted-foreground mt-2">
                      {block.notes}
                    </Small>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
