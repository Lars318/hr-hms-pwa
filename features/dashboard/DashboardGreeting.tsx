"use client";

import { useEffect, useState } from "react";

function getGreeting(hour: number) {
  if (hour < 10) return "God morgen";
  if (hour < 12) return "Hei";
  if (hour < 17) return "God ettermiddag";
  return "God kveld";
}

interface Props {
  name: string;
  email: string;
}

export function DashboardGreeting({ name, email }: Props) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  return (
    <p className="text-xs text-muted-foreground">
      {greeting ? `${greeting}, ${name}` : name} · {email}
    </p>
  );
}
