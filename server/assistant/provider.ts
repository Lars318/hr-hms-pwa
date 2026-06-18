import type { Role } from "@prisma/client";
import { match, type MatchResult } from "./matcher";

export type { MatchResult };

export function ask(question: string, role: Role): MatchResult {
  return match(question, role);
}
