
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
import { Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateMealPlan } from '@/ai/flows/generate-meal-plan-flow';


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
];


export default function Home() {
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState<keyof typeof activityFactors>("Sedentary");
  const [calorieGoal, setCalorieGoal] = useState<"lose" | "maintain" | "gain">("maintain");
  const [surplusDeficitPercentage, setSurplusDeficitPercentage] = useState<number>(15);
  
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

  // Meal Plan State
  const [generatedMealPlan, setGeneratedMealPlan] = useState<GenerateMealPlanOutput | null>(null);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState<boolean>(false);
  const [userDeclinedMealPlan, setUserDeclinedMealPlan] = useState<boolean>(false);


  useEffect(() => {
    // Check for saved dark mode preference in localStorage
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
        // Default to system preference if no saved preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
        if (prefersDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
  }, []);

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

    if (!weight || weight <= 0) {
      setWeightError("Please enter a valid weight.");
      isValid = false;
    } else {
      setWeightError(null);
    }

    if (!height || height <= 0) {
      setHeightError("Please enter a valid height.");
      isValid = false;
    } else {
      setHeightError(null);
    }

    if (!age || age < 15 || age > 100) {
      setAgeError("Please enter a valid age (15-100).");
      isValid = false;
    } else {
      setAgeError(null);
    }

    return isValid;
  };

  const calculateCalories = () => {
    if (!validateInputs()) {
      toast({
        title: "Error",
        description: "Please correct the invalid fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setGeneratedMealPlan(null); // Clear old meal plan
    setUserDeclinedMealPlan(false); // Reset decline status for new calculation


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


        let proteinGrams: number;
        if (calorieGoal === "gain") {
          proteinGrams = weight * 2; 
        } else {
          proteinGrams = weight * 1.4; 
        }
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
    }, 500);
  };

  const handleGenerateMealPlan = async () => {
    if (!maintenanceCalories) return;

    let targetCalories = maintenanceCalories;
    if (calorieGoal === 'gain' && calorieSurplus) {
      targetCalories = calorieSurplus;
    } else if (calorieGoal === 'lose' && calorieDeficit) {
      targetCalories = calorieDeficit;
    }

    setIsGeneratingMealPlan(true);
    setGeneratedMealPlan(null); 

    try {
      const plan = await generateMealPlan({ calories: targetCalories });
      setGeneratedMealPlan(plan);
      toast({
        title: "Meal Plan Generated!",
        description: "Your sample Indian meal plan is ready.",
      });
    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error",
        description: "Could not generate meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };


  const calorieGoalLabelText =
    calorieGoal === "maintain"
      ? calorieGoalLabels.maintain()
      : calorieGoalLabels[calorieGoal](surplusDeficitPercentage);

  return (
    <div className={`min-h-screen py-6 flex flex-col justify-center sm:py-12`}>
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--turquoise))] to-[hsl(var(--bright-amber))] shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-card shadow-2xl sm:rounded-3xl sm:p-8">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-foreground">CalorieWise</h1>
              <div className="flex items-center">
                <Label htmlFor="dark-mode" className="mr-2 text-sm text-foreground">Dark Mode</Label>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleDarkModeChange} />
              </div>
            </div>
            
            <p className="mb-6 text-sm text-muted-foreground">
              Enter your details to calculate daily calorie needs. Calculations use the Mifflin-St Jeor equation.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="weight" className="text-sm font-medium text-foreground">
                  Weight (kg)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent><p>Your current weight in kilograms.</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  id="weight"
                  placeholder="e.g., 70"
                  className="mt-1 text-sm"
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  aria-invalid={!!weightError}
                />
                {weightError && <p className="text-xs text-destructive mt-1">{weightError}</p>}
              </div>

              <div>
                <Label htmlFor="height" className="text-sm font-medium text-foreground">
                  Height (cm)
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent><p>Your height in centimeters.</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  id="height"
                  placeholder="e.g., 175"
                  className="mt-1 text-sm"
                  onChange={(e) => setHeight(parseFloat(e.target.value))}
                  aria-invalid={!!heightError}
                />
                {heightError && <p className="text-xs text-destructive mt-1">{heightError}</p>}
              </div>

              <div>
                <Label htmlFor="age" className="text-sm font-medium text-foreground">
                  Age (years)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent><p>Your age in years (15-100).</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  id="age"
                  placeholder="e.g., 30"
                  className="mt-1 text-sm"
                  onChange={(e) => setAge(parseFloat(e.target.value))}
                  aria-invalid={!!ageError}
                />
                {ageError && <p className="text-xs text-destructive mt-1">{ageError}</p>}
              </div>

              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-foreground">Gender</Label>
                <Select value={gender} onValueChange={(value) => setGender(value as "male" | "female")}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="activity-level" className="text-sm font-medium text-foreground">Activity Level</Label>
                <Select value={activityLevel} onValueChange={(value) => setActivityLevel(value as keyof typeof activityFactors)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Select activity level" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(activityFactors).map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="calorie-goal" className="text-sm font-medium text-foreground">Calorie Goal</Label>
                 <Select value={calorieGoal} onValueChange={(value) => setCalorieGoal(value as "lose" | "maintain" | "gain")}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Select calorie goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Gain Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {calorieGoal !== "maintain" && (
                <div>
                  <Label htmlFor="surplus-deficit" className="text-sm font-medium text-foreground">
                    {calorieGoal === "gain" ? "Surplus" : "Deficit"} (%)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent><p>Percentage to {calorieGoal === "gain" ? "add to" : "subtract from"} maintenance calories.</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Slider
                    id="surplus-deficit"
                    defaultValue={[surplusDeficitPercentage]}
                    max={25} 
                    min={10}
                    step={5}
                    onValueChange={(value) => setSurplusDeficitPercentage(value[0])}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Selected: {surplusDeficitPercentage}%</p>
                </div>
              )}
              
              <Button
                className="gradient-button w-full text-base py-3 mt-6"
                onClick={calculateCalories}
                disabled={isCalculating}
              >
                {isCalculating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : "Calculate Calories"}
              </Button>
            </div>

            {maintenanceCalories && !isCalculating && (
              <div className="mt-8 space-y-6">
                <CalorieCard
                  title={`Maintenance ⚖️`}
                  calories={maintenanceCalories}
                  color="hsl(var(--bright-amber))"
                  description="Calories to maintain your current weight."
                />
                {calorieGoal === "gain" && calorieSurplus && (
                  <CalorieCard
                    title={`${calorieGoalLabelText} 🍔`}
                    calories={calorieSurplus}
                    color="hsl(var(--turquoise))"
                    description={`Target calories for gaining weight/muscle with a ${surplusDeficitPercentage}% surplus.`}
                  />
                )}
                {calorieGoal === "lose" && calorieDeficit && (
                  <CalorieCard
                    title={`${calorieGoalLabelText} 🏃‍♂️`}
                    calories={calorieDeficit}
                    color="hsl(var(--coral-red))"
                    description={`Target calories for losing weight with a ${surplusDeficitPercentage}% deficit.`}
                  />
                )}

                {(protein || fat || carbs) && (
                  <Card className="shadow-lg rounded-2xl border-border overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-xl text-foreground">Macronutrient Breakdown</CardTitle>
                      <CardDescription className="text-xs">Approximate daily targets based on your {calorieGoal} goal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><strong className="text-foreground">Protein:</strong> {protein}g</p>
                      <p><strong className="text-foreground">Fat:</strong> {fat}g</p>
                      <p><strong className="text-foreground">Carbs:</strong> {carbs}g</p>
                    </CardContent>
                  </Card>
                )}

                {waterIntake && (
                  <Card className="shadow-lg rounded-2xl border-border overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-xl text-foreground">Daily Water Intake</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold" style={{color: "hsl(var(--primary))"}}>{waterIntake} ml</p>
                      <p className="text-xs text-muted-foreground">Approximate daily hydration goal.</p>
                    </CardContent>
                  </Card>
                )}

                {!generatedMealPlan && !isGeneratingMealPlan && !userDeclinedMealPlan && (
                  <Card className="mt-6 shadow-lg rounded-2xl border-border">
                    <CardHeader>
                      <CardTitle className="text-xl text-foreground">Need a Meal Plan?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Would you like a sample Indian meal plan based on your {calorieGoalLabelText.toLowerCase()} calories?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleGenerateMealPlan} className="gradient-button flex-1 py-2.5">
                          Yes, Generate Meal Plan
                        </Button>
                        <Button variant="outline" onClick={() => setUserDeclinedMealPlan(true)} className="flex-1 py-2.5">
                          No, Thanks
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isGeneratingMealPlan && (
                  <div className="mt-6 flex items-center justify-center p-6 rounded-2xl border-border bg-card">
                    <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
                    <p className="text-foreground">Generating your meal plan, please wait...</p>
                  </div>
                )}

                {generatedMealPlan && (
                  <Card className="mt-6 shadow-lg rounded-2xl border-border">
                    <CardHeader>
                      <CardTitle className="text-xl text-foreground">Your Sample Indian Meal Plan</CardTitle>
                      {generatedMealPlan.estimatedTotalCalories && (
                          <CardDescription className="text-xs">Estimated Total Calories: {generatedMealPlan.estimatedTotalCalories} kcal</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {generatedMealPlan.dailyMealPlan.map((meal, index) => (
                        <div key={index} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                          <h4 className="font-semibold text-lg mb-2 capitalize" style={{ color: mealColors[index % mealColors.length]}}>
                            {meal.name} {meal.totalCalories ? `(~${meal.totalCalories} kcal)` : ''}
                          </h4>
                          <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                            {meal.items.map((item, itemIndex) => (
                              <li key={itemIndex}>
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
    <Card className="shadow-lg rounded-2xl border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">{title}</CardTitle>
         {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold" style={{ color: color }}>
          {calories}
        </p>
        <p className="text-sm text-muted-foreground" style={{ color: color, opacity: 0.8 }}>Calories/day</p>
      </CardContent>
    </Card>
  );
}

