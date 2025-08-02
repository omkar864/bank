
'use server';
/**
 * @fileOverview A Genkit flow for transliterating English text to Hindi.
 *
 * - transliterate - A function that handles the transliteration process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TransliterateInputSchema = z.object({
  text: z.string().describe('The English text to transliterate.'),
});
export type TransliterateInput = z.infer<typeof TransliterateInputSchema>;

const TransliterateOutputSchema = z.object({
  hindiText: z.string().describe('The transliterated Hindi text.'),
});
export type TransliterateOutput = z.infer<typeof TransliterateOutputSchema>;

const transliteratePrompt = ai.definePrompt({
  name: 'transliteratePrompt',
  input: { schema: TransliterateInputSchema },
  output: { schema: TransliterateOutputSchema },
  prompt: `Transliterate the following English word or phrase into its equivalent Hindi (Devanagari) script. Provide only the transliterated Hindi text, without any additional explanation or English: "{{{text}}}"`,
  config: {
    temperature: 0.1, // Keep temperature low for deterministic transliteration
  },
});

const transliterateFlow = ai.defineFlow(
  {
    name: 'transliterateFlow',
    inputSchema: TransliterateInputSchema,
    outputSchema: TransliterateOutputSchema,
  },
  async (input) => {
    // Handle empty or whitespace-only input to avoid unnecessary API calls
    if (!input.text || input.text.trim() === '') {
      return { hindiText: '' };
    }

    const { output } = await transliteratePrompt(input);
    return output!;
  }
);

// Wrapper function to be used by the client components
export async function transliterate(text: string): Promise<string> {
  const result = await transliterateFlow({ text });
  return result.hindiText;
}
