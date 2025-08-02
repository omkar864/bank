import { isServer } from "@/lib/utils";
import type { Genkit } from "genkit";

// Use a dynamic import for the server-only AI instance
export const ai: Genkit = isServer()
  ? require("./ai-instance").ai
  : ({} as Genkit);

export function isAiEnabled(): boolean {
  // Simple check to see if the ai object has been populated with keys.
  // This is a basic way to infer if the server-side require() succeeded.
  return Object.keys(ai).length > 0;
}
