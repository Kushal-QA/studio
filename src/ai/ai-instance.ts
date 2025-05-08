
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Log to check if the API key is loaded on the server.
// This will appear in your Next.js server terminal, not the browser console.
if (typeof process !== 'undefined' && process.env) {
  console.log("Server-side GOOGLE_GENAI_API_KEY:", process.env.GOOGLE_GENAI_API_KEY ? "SET" : "NOT SET - THIS IS REQUIRED FOR AI FEATURES");
}


export const ai = genkit({
  promptDir: './prompts', // This directory is not currently used by the generateMealPlanFlow
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Set a valid default model. gemini-1.5-flash is a common choice for balanced performance and cost.
  model: 'googleai/gemini-1.5-flash',
});

