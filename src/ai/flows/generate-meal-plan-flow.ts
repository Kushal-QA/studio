
'use server';
/**
 * @fileOverview Generates a sample Indian meal plan based on calorie target, weight goal, and diet preference.
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
  weightGoal: z.enum(['lose', 'maintain', 'gain']).describe('User weight goal: lose, maintain, or gain weight.'),
  dietPreference: z.enum(['vegetarian', 'non-vegetarian']).describe('User diet preference: vegetarian or non-vegetarian.'),
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

const GenerateMealPlanOutputSchema = z.object({
  dailyMealPlan: z.array(MealSchema).describe("A list of meals for the entire day including Breakfast, Lunch, Dinner, and optionally Snacks."),
  estimatedTotalCalories: z.number().optional().describe("Estimated total calories for the entire day's meal plan (optional)"),
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;


const generateMealPlanPrompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateMealPlanInputSchema },
  output: { schema: GenerateMealPlanOutputSchema },
  prompt: `You are an expert nutritionist specializing in Indian cuisine.
Your task is to generate a detailed one-day meal plan for an Indian user.

User Preferences:
- Weight Goal: {{{weightGoal}}}
- Target Daily Calories: {{{calories}}}
- Diet Preference: {{{dietPreference}}}

Instructions:
1.  **Diet Type**: Adhere to the specified '{{{dietPreference}}}' preference.
2.  **Macros**: Aim for a balanced distribution of macronutrients.
    - If '{{{weightGoal}}}' is 'lose': Target approximately 40% carbs, 30% protein, 30% fats.
    - If '{{{weightGoal}}}' is 'gain': Target approximately 50% carbs, 25-30% protein, 20-25% fats. Ensure sufficient protein for muscle growth and use complex carbs for energy.
    - If '{{{weightGoal}}}' is 'maintain': Target approximately 50% carbs, 20-25% protein, 25-30% fats.
3.  **Meals**: The meal plan MUST include Breakfast, Lunch, and Dinner. Optionally, you can include Mid-Morning Snack and Evening Snack if appropriate for the calorie target and dietary goals. Ensure items are well-distributed across meals.
4.  **Food Choices based on Goal**:
    - If '{{{weightGoal}}}' is 'lose': Focus on high-protein, high-fiber, low-glycemic index foods. Examples: dal, roti (whole wheat/multigrain), lots of vegetables, salads, sprouts, quinoa. Minimize added fats and simple carbs.
    - If '{{{weightGoal}}}' is 'gain': Include calorie-dense and protein-rich foods. Examples: nuts (almonds, walnuts), seeds (chia, flax), ghee, full-fat dairy (paneer, curd), bananas, peanut butter, chicken, fish, eggs (if '{{{dietPreference}}}' is 'non-vegetarian'), rice, potatoes.
    - If '{{{weightGoal}}}' is 'maintain': Focus on balanced portions of whole foods. Examples: roti/rice, sabzi (vegetable curry), dal, curd.
5.  **Common Indian Foods**: Utilize common Indian ingredients and dishes.
    - Vegetarian examples: roti, rice, various dals (lentil preparations), paneer (Indian cheese), seasonal vegetables, curd (yogurt), poha, upma, idli, dosa, khichdi, sabudana.
    - Non-vegetarian examples (if '{{{dietPreference}}}' is 'non-vegetarian'): chicken curry/tikka, fish fry/curry, egg bhurji/curry/boiled eggs.
6.  **Avoid**: Strictly avoid processed foods, sugary drinks, deep-fried items (unless specified for gain in moderation), and excessive refined sugar.
7.  **Calorie Details**: For each food item, provide a name, quantity, and estimated calories. Calculate total calories for each meal and an overall estimated total for the day. Ensure the 'estimatedTotalCalories' for the 'dailyMealPlan' is as close as possible to the target '{{{calories}}}'.
8.  **Output Format**: The output MUST be in the specified JSON format. Ensure all field names and structures match the output schema precisely.

Example of a meal item structure:
{ "name": "Roti (Whole Wheat)", "quantity": "2 small", "calories": 140 }

Example of a meal structure:
{
  "name": "Breakfast",
  "items": [
    { "name": "Poha", "quantity": "1.5 cups", "calories": 250 },
    { "name": "Curd (Dahi)", "quantity": "1 cup", "calories": 100 }
  ],
  "totalCalories": 350
}

Begin generating the meal plan now.
`,
});

const generateMealPlanFlow = ai.defineFlow(
  {
    name: 'generateMealPlanFlow',
    inputSchema: GenerateMealPlanInputSchema,
    outputSchema: GenerateMealPlanOutputSchema,
  },
  async (input) => {
    console.log('Generating meal plan for input:', JSON.stringify(input, null, 2));
    
    const { output } = await generateMealPlanPrompt(input);
    
    if (!output) {
      console.error('Meal plan generation failed: Model did not return valid output.');
      throw new Error('Failed to generate meal plan. The model did not return valid output.');
    }
    
    const mealNames = output.dailyMealPlan.map(meal => meal.name.toLowerCase());
    if (!mealNames.includes('breakfast') || !mealNames.includes('lunch') || !mealNames.includes('dinner')) {
        console.warn("Generated meal plan might be missing core meals (Breakfast, Lunch, Dinner). Output:", JSON.stringify(output, null, 2));
    }
    return output;
  }
);

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<GenerateMealPlanOutput> {
  try {
    return await generateMealPlanFlow(input);
  } catch (error) {
    console.error('Error in generateMealPlan server function:', error);
    // Consider logging the error to a monitoring service in production
    // For now, re-throw to be caught by client
    if (error instanceof Error) {
      // Check for specific error messages if needed, e.g. API key issues
      if (error.message.includes("API key not valid")) {
         throw new Error("API Key is invalid or missing. Please check server configuration.");
      }
       if (error.message.includes("Model not found")) {
         throw new Error("AI Model not found. Please check model name in configuration.");
       }
    }
    throw new Error(`Failed to generate meal plan: ${error instanceof Error ? error.message : String(error)}`);
  }
}

