
"use client";

import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan-flow';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info, Loader2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateMealPlan } from '@/ai/flows/generate-meal-plan-flow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";


const activityFactors = {
  Sedentary: 1.2,
  "Lightly Active": 1.375,
  "Moderately Active": 1.55,
  Active: 1.725,
  "Very Active": 1.9,
};

const calculateBMR = (weight: number, height: number, age: number, gender: "male" | "female") => {
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

const calorieGoalLabels = {
  lose: (percentage: number) => `Deficit (${percentage}%)`,
  maintain: () => "Maintain Weight",
  gain: (percentage: number) => `Surplus (${percentage}%)`,
};

const mealColors = [
  "hsl(var(--turquoise))",
  "hsl(var(--coral-red))",
  "hsl(var(--bright-amber))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
];


export default function Home() {
  const [weight, setWeight] = useState<number | null>(70);
  const [height, setHeight] = useState<number | null>(175);
  const [age, setAge] = useState<number | null>(30);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState<keyof typeof activityFactors>("Sedentary");
  const [calorieGoal, setCalorieGoal] = useState<"lose" | "maintain" | "gain">("maintain");
  const [surplusDeficitPercentage, setSurplusDeficitPercentage] = useState<number>(15);
  const [dietPreference, setDietPreference] = useState<'vegetarian' | 'non-vegetarian'>('vegetarian');
  
  const [maintenanceCalories, setMaintenanceCalories] = useState<number | null>(null);
  const [calorieSurplus, setCalorieSurplus] = useState<number | null>(null);
  const [calorieDeficit, setCalorieDeficit] = useState<number | null>(null);
  
  const [protein, setProtein] = useState<number | null>(null);
  const [fat, setFat] = useState<number | null>(null);
  const [carbs, setCarbs] = useState<number | null>(null);
  const [waterIntake, setWaterIntake] = useState<number | null>(null);
  
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [weightError, setWeightError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const [generatedMealPlan, setGeneratedMealPlan] = useState<GenerateMealPlanOutput | null>(null);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState<boolean>(false);
  const [userDeclinedMealPlan, setUserDeclinedMealPlan] = useState<boolean>(false);

  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      const newDarkMode = savedDarkMode === 'true';
      setDarkMode(newDarkMode);
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
        if (typeof window !== 'undefined') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(prefersDark);
            if (prefersDark) document.documentElement.classList.add('dark');
        }
    }

    const storedApiKey = localStorage.getItem('genAiApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      // Only show dialog if API key is NOT set by environment variable.
      // This check is a bit indirect; assumes if process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY is set,
      // we don't need to prompt. Client-side can't directly check server .env.
      // A better approach might be an API endpoint that confirms key status.
      // For now, if localStorage is empty, we assume we might need to prompt.
      // The actual API call failure will be the ultimate trigger if no key is available.
    }
  }, []);
  
  const handleApiKeySubmit = () => {
    if (tempApiKey) {
      localStorage.setItem('genAiApiKey', tempApiKey);
      setApiKey(tempApiKey);
      setShowApiKeyDialog(false);
      toast({ title: "API Key Saved", description: "Your API key has been saved in browser storage." });
    } else {
      toast({ title: "Error", description: "Please enter an API key.", variant: "destructive" });
    }
  };


  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const validateInputs = () => {
    let isValid = true;
    if (!weight || weight <= 0) { setWeightError("Please enter a valid weight."); isValid = false; } else { setWeightError(null); }
    if (!height || height <= 0) { setHeightError("Please enter a valid height."); isValid = false; } else { setHeightError(null); }
    if (!age || age < 15 || age > 100) { setAgeError("Please enter a valid age (15-100)."); isValid = false; } else { setAgeError(null); }
    return isValid;
  };

  const calculateCalories = () => {
    if (!validateInputs()) {
      toast({ title: "Error", description: "Please correct the invalid fields.", variant: "destructive" });
      return;
    }
    setIsCalculating(true);
    setGeneratedMealPlan(null);
    setUserDeclinedMealPlan(false);

    setTimeout(() => {
      if (weight && height && age) {
        const bmr = calculateBMR(weight, height, age, gender);
        const maintenance = bmr * activityFactors[activityLevel];
        setMaintenanceCalories(Math.round(maintenance));

        let surplusMultiplier = 1 + surplusDeficitPercentage / 100;
        let deficitMultiplier = 1 - surplusDeficitPercentage / 100;
        let surplus = maintenance * surplusMultiplier;
        let deficit = maintenance * deficitMultiplier;
        setCalorieSurplus(Math.round(surplus));
        setCalorieDeficit(Math.round(deficit));

        let targetCaloriesForMacros = maintenance;
        if (calorieGoal === "gain") targetCaloriesForMacros = surplus;
        if (calorieGoal === "lose") targetCaloriesForMacros = deficit;

        let proteinGrams = weight * (calorieGoal === "gain" ? 2 : 1.4);
        setProtein(Math.round(proteinGrams));
        const fatCalories = targetCaloriesForMacros * 0.25;
        const fatGrams = fatCalories / 9;
        setFat(Math.round(fatGrams));
        const proteinCalories = proteinGrams * 4;
        const carbsCalories = targetCaloriesForMacros - proteinCalories - fatCalories;
        const carbsGrams = carbsCalories / 4;
        setCarbs(Math.round(carbsGrams > 0 ? carbsGrams : 0));
        const water = weight * 35;
        setWaterIntake(Math.round(water));
      }
      setIsCalculating(false);
      toast({ title: "Calculations Complete!", description: "Your calorie and macronutrient estimates are ready." });
    }, 500);
  };

  const handleGenerateMealPlan = async () => {
    if (!maintenanceCalories) return;
     // Check if API key is available (either from env var or localStorage)
    const currentApiKey = process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY || apiKey;
    if (!currentApiKey) {
      setShowApiKeyDialog(true);
      toast({
        title: "API Key Required",
        description: "Please enter your Google Generative AI API key to generate a meal plan.",
        variant: "destructive",
      });
      return;
    }


    let targetCalories = maintenanceCalories;
    if (calorieGoal === 'gain' && calorieSurplus) targetCalories = calorieSurplus;
    else if (calorieGoal === 'lose' && calorieDeficit) targetCalories = calorieDeficit;

    setIsGeneratingMealPlan(true);
    setGeneratedMealPlan(null); 

    try {
      console.log(`Requesting meal plan for ${targetCalories} calories, goal: ${calorieGoal}, preference: ${dietPreference}.`);
      const plan = await generateMealPlan({ 
        calories: targetCalories,
        weightGoal: calorieGoal,
        dietPreference: dietPreference
      });
      setGeneratedMealPlan(plan);
      toast({ title: "Meal Plan Generated!", description: "Your sample Indian meal plan is ready." });
    } catch (error) {
      console.error("Full error generating meal plan (client-side):", error);
      let description = "Could not generate meal plan. Please try again.";
      if (error instanceof Error) {
        description = error.message; // Use the error message from the flow
        if (error.message.toLowerCase().includes("api key")) {
           setShowApiKeyDialog(true); // Prompt for API key if it's an API key error
        }
      }
      toast({ title: "Error Generating Meal Plan", description, variant: "destructive" });
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };

  const calorieGoalLabelText = calorieGoal === "maintain" ? calorieGoalLabels.maintain() : calorieGoalLabels[calorieGoal](surplusDeficitPercentage);

  return (
    <div className={`min-h-screen py-6 flex flex-col justify-center sm:py-12`}>
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter API Key</DialogTitle>
            <DialogDescription>
              Please enter your Google Generative AI API key to enable meal plan generation. Your key will be stored locally in your browser.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="col-span-3"
                placeholder="Enter your API Key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>Cancel</Button>
            <Button onClick={handleApiKeySubmit}><KeyRound className="mr-2 h-4 w-4" /> Save Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--turquoise))] to-[hsl(var(--bright-amber))] shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-card shadow-2xl sm:rounded-3xl sm:p-8">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-foreground">CalorieWise</h1>
              <div className="flex items-center">
                <Label htmlFor="dark-mode" className="mr-2 text-sm text-foreground">Dark Mode</Label>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleDarkModeChange} aria-label="Toggle dark mode" />
              </div>
            </div>
            
            <p className="mb-6 text-sm text-muted-foreground">
              Enter your details to calculate daily calorie needs. Calculations use the Mifflin-St Jeor equation.
            </p>

            <div className="space-y-3"> {/* Reduced spacing */}
              <div>
                <Label htmlFor="weight" className="text-sm font-medium text-foreground">Weight (kg) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Your current weight in kilograms.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Input type="number" id="weight" placeholder="e.g., 70" className="mt-1 text-sm" value={weight ?? ""} onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : null)} aria-invalid={!!weightError} aria-describedby="weight-error"/>
                {weightError && <p id="weight-error" className="text-xs text-destructive mt-1">{weightError}</p>}
              </div>

              <div>
                <Label htmlFor="height" className="text-sm font-medium text-foreground">Height (cm) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Your height in centimeters.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Input type="number" id="height" placeholder="e.g., 175" className="mt-1 text-sm" value={height ?? ""} onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : null)} aria-invalid={!!heightError} aria-describedby="height-error"/>
                {heightError && <p id="height-error" className="text-xs text-destructive mt-1">{heightError}</p>}
              </div>

              <div>
                <Label htmlFor="age" className="text-sm font-medium text-foreground">Age (years) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Your age in years (15-100).</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Input type="number" id="age" placeholder="e.g., 30" className="mt-1 text-sm" value={age ?? ""} onChange={(e) => setAge(e.target.value ? parseFloat(e.target.value) : null)} aria-invalid={!!ageError} aria-describedby="age-error"/>
                {ageError && <p id="age-error" className="text-xs text-destructive mt-1">{ageError}</p>}
              </div>

              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-foreground">Gender</Label>
                <Select value={gender} onValueChange={(value) => setGender(value as "male" | "female")}>
                  <SelectTrigger id="gender" className="mt-1 text-sm"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="activity-level" className="text-sm font-medium text-foreground">Activity Level <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Sedentary: little/no exercise. Lightly Active: light exercise 1-3 days/wk. Moderately Active: moderate exercise 3-5 days/wk. Active: hard exercise 6-7 days/wk. Very Active: very hard exercise/physical job.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Select value={activityLevel} onValueChange={(value) => setActivityLevel(value as keyof typeof activityFactors)}>
                  <SelectTrigger id="activity-level" className="mt-1 text-sm"><SelectValue placeholder="Select activity level" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(activityFactors).map((level) => (<SelectItem key={level} value={level}>{level}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="calorie-goal" className="text-sm font-medium text-foreground">Calorie Goal</Label>
                 <Select value={calorieGoal} onValueChange={(value) => setCalorieGoal(value as "lose" | "maintain" | "gain")}>
                  <SelectTrigger id="calorie-goal" className="mt-1 text-sm"><SelectValue placeholder="Select calorie goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Gain Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {calorieGoal !== "maintain" && (
                <div>
                  <Label htmlFor="surplus-deficit" className="text-sm font-medium text-foreground">{calorieGoal === "gain" ? "Surplus" : "Deficit"} (%) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Percentage to {calorieGoal === "gain" ? "add to" : "subtract from"} maintenance calories (10-25%).</p></TooltipContent></Tooltip></TooltipProvider></Label>
                  <Slider id="surplus-deficit" defaultValue={[surplusDeficitPercentage]} max={25} min={10} step={5} onValueChange={(value) => setSurplusDeficitPercentage(value[0])} className="mt-2" aria-label={`Surplus/Deficit percentage: ${surplusDeficitPercentage}%`}/>
                  <p className="text-xs text-muted-foreground mt-1">Selected: {surplusDeficitPercentage}%</p>
                </div>
              )}

               <div>
                <Label htmlFor="diet-preference" className="text-sm font-medium text-foreground">Diet Preference <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Select your dietary preference for the meal plan.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Select value={dietPreference} onValueChange={(value) => setDietPreference(value as 'vegetarian' | 'non-vegetarian')}>
                  <SelectTrigger id="diet-preference" className="mt-1 text-sm"><SelectValue placeholder="Select diet preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button className="gradient-button w-full text-base py-2.5 mt-4" onClick={calculateCalories} disabled={isCalculating}> {/* Adjusted padding and margin */}
                {isCalculating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : "Calculate Calories"}
              </Button>
            </div>

            {maintenanceCalories !== null && !isCalculating && (
              <div className="mt-6 space-y-4"> {/* Adjusted spacing */}
                <CalorieCard title={`Maintenance ⚖️`} calories={maintenanceCalories} color="hsl(var(--bright-amber))" description="Calories to maintain your current weight."/>
                {calorieGoal === "gain" && calorieSurplus !== null && (<CalorieCard title={`${calorieGoalLabelText} 🍔`} calories={calorieSurplus} color="hsl(var(--turquoise))" description={`Target for weight/muscle gain with ${surplusDeficitPercentage}% surplus.`}/>)}
                {calorieGoal === "lose" && calorieDeficit !== null && (<CalorieCard title={`${calorieGoalLabelText} 🏃‍♂️`} calories={calorieDeficit} color="hsl(var(--coral-red))" description={`Target for weight loss with ${surplusDeficitPercentage}% deficit.`}/>)}

                {(protein !== null || fat !== null || carbs !== null) && (
                  <Card className="shadow-lg rounded-2xl border-border overflow-hidden">
                    <CardHeader><CardTitle className="text-lg text-foreground">Macronutrient Breakdown</CardTitle><CardDescription className="text-xs">Approx. targets for {calorieGoal} goal. <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-bottom text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Protein: {calorieGoal === 'gain' ? '1.6-2.2g/kg' : '1.2-1.6g/kg'}. Fats: ~20-30% of calories. Carbs: Remainder.</p></TooltipContent></Tooltip></TooltipProvider></CardDescription></CardHeader>
                    <CardContent className="space-y-1 text-sm"> {/* Adjusted spacing */}
                      <p><strong className="text-foreground">Protein:</strong> {protein}g</p>
                      <p><strong className="text-foreground">Fat:</strong> {fat}g</p>
                      <p><strong className="text-foreground">Carbs:</strong> {carbs}g</p>
                    </CardContent>
                  </Card>
                )}

                {waterIntake !== null && (
                  <Card className="shadow-lg rounded-2xl border-border overflow-hidden">
                    <CardHeader><CardTitle className="text-lg text-foreground">Daily Water Intake <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-bottom text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Based on ~35ml per kg of body weight.</p></TooltipContent></Tooltip></TooltipProvider></CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold" style={{color: "hsl(var(--primary))"}}>{waterIntake} ml</p>
                      <p className="text-xs text-muted-foreground">Approximate daily hydration goal.</p>
                    </CardContent>
                  </Card>
                )}

                {!generatedMealPlan && !isGeneratingMealPlan && !userDeclinedMealPlan && (
                  <Card className="mt-4 shadow-lg rounded-2xl border-border"> {/* Adjusted margin */}
                    <CardHeader><CardTitle className="text-lg text-foreground">Need a Meal Plan?</CardTitle></CardHeader>
                    <CardContent>
                      <p className="mb-3 text-sm text-muted-foreground"> {/* Adjusted margin */}
                        Generate a sample Indian meal plan for your {calorieGoalLabelText.toLowerCase()} calories ({dietPreference})?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2"> {/* Adjusted gap */}
                        <Button onClick={handleGenerateMealPlan} className="gradient-button flex-1 py-2" disabled={isGeneratingMealPlan}> {/* Adjusted padding */}
                          {isGeneratingMealPlan ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Yes, Generate Meal Plan"}
                        </Button>
                        <Button variant="outline" onClick={() => setUserDeclinedMealPlan(true)} className="flex-1 py-2" disabled={isGeneratingMealPlan}> {/* Adjusted padding */}
                          No, Thanks
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isGeneratingMealPlan && !generatedMealPlan && (
                  <div className="mt-4 flex items-center justify-center p-4 rounded-2xl border-border bg-card"> {/* Adjusted padding & margin */}
                    <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" /> {/* Adjusted size */}
                    <p className="text-foreground text-sm">Generating your meal plan, please wait...</p> {/* Adjusted font size */}
                  </div>
                )}

                {generatedMealPlan && (
                  <Card className="mt-4 shadow-lg rounded-2xl border-border"> {/* Adjusted margin */}
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">Your Sample Indian Meal Plan</CardTitle>
                      {generatedMealPlan.estimatedTotalCalories && (<CardDescription className="text-xs">Est. Total: {generatedMealPlan.estimatedTotalCalories} kcal ({calorieGoalLabelText}, {dietPreference})</CardDescription>)}
                    </CardHeader>
                    <CardContent className="space-y-3"> {/* Adjusted spacing */}
                      {generatedMealPlan.dailyMealPlan.map((meal, index) => (
                        <div key={meal.name + index} className="border-b border-border pb-2.5 last:border-b-0 last:pb-0"> {/* Adjusted padding */}
                          <h4 className="font-semibold text-md mb-1.5 capitalize" style={{ color: mealColors[index % mealColors.length]}}> {/* Adjusted font size & margin */}
                            {meal.name} {meal.totalCalories ? `(~${meal.totalCalories} kcal)` : ''}
                          </h4>
                          <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground"> {/* Adjusted padding, spacing & font size */}
                            {meal.items.map((item, itemIndex) => (
                              <li key={item.name + itemIndex}>
                                <span className="text-foreground font-medium">{item.name}:</span> {item.quantity} 
                                {item.calories ? ` (~${item.calories} kcal)` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalorieCardProps {
  title: string;
  calories: number;
  color: string;
  description?: string;
}

function CalorieCard({ title, calories, color, description }: CalorieCardProps) {
  return (
    <Card className="shadow-lg rounded-2xl border-border overflow-hidden transition-all hover:shadow-xl animate-fadeIn"> {/* Added animation */}
      <CardHeader>
        <CardTitle className="text-lg text-foreground">{title}</CardTitle> {/* Adjusted font size */}
         {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold" style={{ color: color }}> {/* Adjusted font size */}
          {calories}
        </p>
        <p className="text-xs text-muted-foreground" style={{ color: color, opacity: 0.8 }}>Calories/day</p> {/* Adjusted font size */}
      </CardContent>
    </Card>
  );
}
