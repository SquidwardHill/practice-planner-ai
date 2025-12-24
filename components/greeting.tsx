"use client";

import { useEffect, useState } from "react";

interface GreetingProps {
  firstName?: string | null;
}

export function Greeting({ firstName }: GreetingProps) {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        return "Good morning";
      } else if (hour < 17) {
        return "Good afternoon";
      } else {
        return "Good evening";
      }
    };

    setGreeting(getGreeting());
  }, []);

  const displayName = firstName
    ? firstName.split(" ")[0] // Get first name only
    : null;

  return (
    <>
      {greeting}
      {displayName ? `, ${displayName}` : ""}!
    </>
  );
}

