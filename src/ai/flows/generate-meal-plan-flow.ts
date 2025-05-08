
'use server';
/**
 * @fileOverview Generates a sample Indian meal plan based on calorie target.
 *
 * - generateMealPlan - A function that handles the meal plan generation process.
 * - GenerateMealPlanInput - The input type for the generateMealPlan function.
 * - GenerateMealPlanOutput - The return type for the generateMealPlan function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'zod';

const MealItemSchema = z.object({
  name: z.string().describe("Name of the food item, e.g., Roti, Dal Makhani, Apple"),
  quantity: z.string().describe("Quantity of the food item, e.g., 2 pieces, 1 cup, 1 medium"),
  calories: z.number().optional().describe("Estimated calories for this item (optional)"),
});

const MealSchema = z.object({
  name: z.string().describe("Name of the meal, e.g., Breakfast, Lunch, Dinner, Snack 1"),
  items: z.array(MealItemSchema).describe("List of food items for this meal"),
  totalCalories: z.number().optional().describe("Estimated total calories for this meal (optional)"),
});

const GenerateMealPlanInputSchema = z.object({
  calories: z.number().describe('Target daily calories for the meal plan.'),
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

const GenerateMealPlanOutputSchema = z.object({
  dailyMealPlan: z.array(MealSchema).describe("A list of meals for the entire day including Breakfast, Lunch, Dinner, and optionally Snacks."),
  estimatedTotalCalories: z.number().optional().describe("Estimated total calories for the entire day's meal plan (optional)"),
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;


const generateMealPlanPrompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly set the model
  input: { schema: GenerateMealPlanInputSchema },
  output: { schema: GenerateMealPlanOutputSchema },
  prompt: `You are an expert nutritionist specializing in Indian cuisine.
Your task is to generate a sample one-day meal plan for an Indian user.

Target Daily Calories: {{{calories}}}

Instructions:
1.  The meal plan should be for a single day and include common Indian dishes.
2.  Structure the plan into distinct meals: Breakfast, Lunch, Dinner. You can also include Morning Snack and Evening Snack if appropriate for the calorie target.
3.  For each meal, list specific food items.
4.  For each food item, provide a realistic quantity (e.g., "2 medium idlis", "1 cup (cooked)", "100g grilled").
5.  Optionally, you can provide an estimated calorie count for each item and for each meal, and an overall estimated total for the day. Try to make the overall estimated total calories as close as possible to the target daily calories.
6.  Focus on a balanced distribution of macronutrients (protein, carbohydrates, fats) from common Indian food sources.
7.  Prioritize readily available and commonly consumed Indian foods. Avoid exotic or hard-to-find ingredients.
8.  The output MUST be in the specified JSON format. Ensure all field names and structures match the output schema.

Example of a meal item:
{ "name": "Roti (Whole Wheat)", "quantity": "2 small", "calories": 140 }

Example of a meal:
{
  "name": "Breakfast",
  "items": [
    { "name": "Poha", "quantity": "1.5 cups", "calories": 250 },
    { "name": "Curd (Dahi)", "quantity": "1 cup", "calories": 100 }
  ],
  "totalCalories": 350
}

Begin generating the meal plan now based on the {{{calories}}} calorie target.
`,
});

const generateMealPlanFlow = ai.defineFlow(
  {
    name: 'generateMealPlanFlow',
    inputSchema: GenerateMealPlanInputSchema,
    outputSchema: GenerateMealPlanOutputSchema,
  },
  async (input) => {
    // Log input for debugging
    console.log('Generating meal plan for input:', JSON.stringify(input, null, 2));
    
    const { output } = await generateMealPlanPrompt(input);
    
    if (!output) {
      console.error('Meal plan generation failed: Model did not return valid output.');
      throw new Error('Failed to generate meal plan. The model did not return valid output.');
    }
    // Basic validation for the presence of core meals
    const mealNames = output.dailyMealPlan.map(meal => meal.name.toLowerCase());
    if (!mealNames.includes('breakfast') || !mealNames.includes('lunch') || !mealNames.includes('dinner')) {
        // This is a soft check, ideally schema validation from Zod handles most of it.
        // If LLM misses core meals, it's an issue.
        console.warn("Generated meal plan might be missing core meals (Breakfast, Lunch, Dinner). Output:", JSON.stringify(output, null, 2));
    }
    return output;
  }
);

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<GenerateMealPlanOutput> {
  try {
    return await generateMealPlanFlow(input);
  } catch (error) {
    // Log the error on the server side as well
    console.error('Error in generateMealPlan server function:', error);
    // Re-throw the error so it can be caught by the client-side caller
    // and display an appropriate message to the user.
    // Consider wrapping in a more specific error type if needed.
    throw error; 
  }
}
