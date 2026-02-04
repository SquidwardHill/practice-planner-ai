"use client";

import { useState, useEffect, useRef } from "react";
import { TitleWithAccent } from "@/components/molecules/title-with-accent";
import { AI_NAME } from "@/lib/config/branding";

const EXAMPLES = [
  "Create a 90-minute varsity basketball practice focusing on transition defense and conditioning.",
  "Plan a 60-minute shooting workout with progression from form to game-speed.",
  "Make a 45-minute defensive fundamentals session for middle school.",
  "75-minute practice that mixes ball handling, passing, and fast break.",
  "Build a 90-minute practice: warm-up, shell drill, then scrimmage.",
];

const ROTATE_MS = 4000;
const FADE_OUT_MS = 700;

export function AskAiTypewriter() {
  const [index, setIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const timeoutIds = useRef<{
    rotate?: ReturnType<typeof setTimeout>;
    advance?: ReturnType<typeof setTimeout>;
  }>({});

  useEffect(() => {
    const scheduleNextRotate = () => {
      timeoutIds.current.rotate = setTimeout(() => {
        setIsLeaving(true);
        timeoutIds.current.advance = setTimeout(() => {
          setIndex((i) => (i + 1) % EXAMPLES.length);
          setIsLeaving(false);
          scheduleNextRotate();
        }, FADE_OUT_MS);
      }, ROTATE_MS);
    };

    scheduleNextRotate();

    return () => {
      if (timeoutIds.current.rotate) clearTimeout(timeoutIds.current.rotate);
      if (timeoutIds.current.advance) clearTimeout(timeoutIds.current.advance);
    };
  }, []);

  return (
    <div className="mb-8 text-center">
      <TitleWithAccent prefix="Ask" accent={AI_NAME} suffix="" />
      <div
        id="ask-ai"
        className="min-h-[2.5em] flex items-center justify-center text-muted-foreground text-base sm:text-lg mt-1 overflow-hidden"
        aria-live="polite"
      >
        <span
          key={index}
          className={`block ${
            isLeaving ? "animate-ask-ai-out" : "animate-ask-ai-in"
          }`}
        >
          {EXAMPLES[index]}
        </span>
      </div>
    </div>
  );
}
