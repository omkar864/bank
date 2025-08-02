'use server';

import { transliterate } from '@/ai/flows/transliterate-flow';

/**
 * Server action to handle transliteration requests from the client.
 * This function runs only on the server, preventing server-side AI code
 * from being bundled with client-side assets.
 * @param text The English text to transliterate.
 * @returns The transliterated Hindi text.
 */
export async function handleTransliteration(text: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }
  // This securely calls the Genkit flow on the server.
  return await transliterate(text);
}
