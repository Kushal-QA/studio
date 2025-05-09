
"use client";

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


const activityFactors = {
  Sedentary: 1.2,
  "Lightly Active": 1.375,
  "Moderately Active": 1.55,
  "Very Active": 1.725,
  "Extremely Active": 1.9,
};

type ActivityLevel = keyof typeof activityFactors;
type Gender = "male" | "female" | "other";
type CalorieGoal = "lose" | "maintain" | "gain";


const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  bodyFat?: number | null
): number => {
  // Katch-McArdle formula if valid body fat percentage is provided
  if (bodyFat && bodyFat > 0 && bodyFat < 70 && weight > 0) {
    const leanMass = weight * (1 - bodyFat / 100);
    if (leanMass > 0) {
      return 370 + 21.6 * leanMass;
    }
  }
  // Mifflin-St Jeor Equation otherwise
  if (gender === "male" || gender === "other") { // Default to male for 'other' or could be averaged/configurable
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else { // female
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

const calorieGoalLabels = {
  lose: (percentage: number) => `Deficit (${percentage}%)`,
  maintain: () => "Maintain Weight",
  gain: (percentage: number) => `Surplus (${percentage}%)`,
};


export default function Home() {
  const [weight, setWeight] = useState<number | null>(86); 
  const [height, setHeight] = useState<number | null>(175);
  const [age, setAge] = useState<number | null>(30);
  const [gender, setGender] = useState<Gender>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("Very Active");
  const [calorieGoal, setCalorieGoal] = useState<CalorieGoal>("lose");
  const [surplusDeficitPercentage, setSurplusDeficitPercentage] = useState<number>(25);
  
  const [bodyFatPercentage, setBodyFatPercentage] = useState<number | null>(null);
  const [dailyExerciseMinutes, setDailyExerciseMinutes] = useState<number | null>(60);


  const [maintenanceCalories, setMaintenanceCalories] = useState<number | null>(null);
  const [targetCalories, setTargetCalories] = useState<number | null>(null);
  
  const [protein, setProtein] = useState<number | null>(null);
  const [fat, setFat] = useState<number | null>(null);
  const [carbs, setCarbs] = useState<number | null>(null);
  const [waterIntake, setWaterIntake] = useState<number | null>(null);
  
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [weightError, setWeightError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [bodyFatError, setBodyFatError] = useState<string | null>(null);
  const [exerciseMinutesError, setExerciseMinutesError] = useState<string | null>(null);
  
  const { toast } = useToast();


  useEffect(() => {
    // Dark mode initialization
    const savedDarkMode = localStorage.getItem('darkMode');
    let initialDarkMode = false;
    if (savedDarkMode) {
      initialDarkMode = savedDarkMode === 'true';
    } else if (typeof window !== 'undefined') {
      initialDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setDarkMode(initialDarkMode);
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
    setWeightError(null);
    setHeightError(null);
    setAgeError(null);
    setBodyFatError(null);
    setExerciseMinutesError(null);

    if (!weight || weight <= 0) { setWeightError("Please enter a valid weight > 0 kg."); isValid = false; }
    if (!height || height <= 0) { setHeightError("Please enter a valid height > 0 cm."); isValid = false; }
    if (!age || age < 15 || age > 100) { setAgeError("Please enter a valid age (15-100)."); isValid = false; }
    if (bodyFatPercentage !== null && (bodyFatPercentage <= 0 || bodyFatPercentage >= 70) ) { setBodyFatError("Body fat % must be between 0 and 70 if provided."); isValid = false; }
    if (dailyExerciseMinutes !== null && dailyExerciseMinutes < 0) { setExerciseMinutesError("Exercise minutes cannot be negative."); isValid = false; }
    
    return isValid;
  };

  const calculateCalories = () => {
    if (!validateInputs()) {
      toast({ title: "Input Error", description: "Please correct the highlighted fields.", variant: "destructive" });
      return;
    }
    setIsCalculating(true);

    // Warnings
    if (calorieGoal === "lose" && surplusDeficitPercentage > 25) {
      toast({
        title: "Warning: Aggressive Deficit",
        description: `A ${surplusDeficitPercentage}% deficit can be hard to sustain and may risk muscle loss. Protein intake of at least 2g/kg body weight is recommended. Proceed with caution.`,
        variant: "destructive",
        duration: 8000,
      });
    }
    if (calorieGoal === "gain" && surplusDeficitPercentage > 20) {
        toast({
            title: "Warning: Aggressive Surplus",
            description: `A ${surplusDeficitPercentage}% surplus may lead to excessive fat gain. Monitor progress closely.`,
            variant: "destructive",
            duration: 8000,
        });
    }


    setTimeout(() => {
      if (weight && height && age) {
        const bmr = calculateBMR(weight, height, age, gender, bodyFatPercentage);
        const maintenance = bmr * activityFactors[activityLevel];
        setMaintenanceCalories(Math.round(maintenance));

        let currentTargetCalories = maintenance;
        if (calorieGoal === "gain") {
          currentTargetCalories = maintenance * (1 + surplusDeficitPercentage / 100);
        } else if (calorieGoal === "lose") {
          currentTargetCalories = maintenance * (1 - surplusDeficitPercentage / 100);
        }
        setTargetCalories(Math.round(currentTargetCalories));


        // Macronutrient Calculation (Defaulting to a high-protein approach)
        let proteinGrams: number = weight * 2.4; // 2.4g/kg (High Protein)
        let fatPercentageOfCalories: number = 0.25; // 25% calories from fat (High Protein)
        
        const roundedProteinGrams = Math.round(proteinGrams);
        setProtein(roundedProteinGrams);

        if ((activityLevel === "Very Active" || activityLevel === "Extremely Active")) {
          if (roundedProteinGrams / weight < 2.0) {
            toast({
              title: "Protein Intake Suggestion",
              description: `For '${activityLevel}', a protein intake of at least 2g/kg body weight is often recommended. Current: ~${(roundedProteinGrams/weight).toFixed(1)}g/kg.`,
              duration: 10000,
            });
          }
        }
        
        const fatCalories = currentTargetCalories * fatPercentageOfCalories;
        const fatGrams = fatCalories / 9;
        setFat(Math.round(fatGrams));
        
        const proteinCalories = roundedProteinGrams * 4;
        const carbsCalories = currentTargetCalories - proteinCalories - fatCalories;
        const carbsGrams = carbsCalories / 4;
        setCarbs(Math.round(carbsGrams > 0 ? carbsGrams : 0));

        // Water Intake Calculation
        const water = (weight * 30) + ((dailyExerciseMinutes || 0) * 0.5); // Using default 0 for exercise if null
        setWaterIntake(Math.round(water));
      }
      setIsCalculating(false);
      toast({ title: "Calculations Complete!", description: "Your calorie and macronutrient estimates are ready." });
    }, 500);
  };


  const calorieGoalLabelText = calorieGoal === "maintain" ? calorieGoalLabels.maintain() : calorieGoalLabels[calorieGoal](surplusDeficitPercentage);
  const formulaUsed = bodyFatPercentage && bodyFatPercentage > 0 && bodyFatPercentage < 70 ? "Katch-McArdle" : "Mifflin-St Jeor";

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
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleDarkModeChange} aria-label="Toggle dark mode" />
              </div>
            </div>
            
            <p className="mb-6 text-sm text-muted-foreground">
              Enter your details to calculate daily calorie needs. Calculations use {formulaUsed}.
            </p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="weight" className="text-sm font-medium text-foreground">Weight (kg) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Your current weight in kilograms. Must be &gt; 0.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Input type="number" id="weight" placeholder="e.g., 70" className={`mt-1 text-sm ${weightError ? 'border-destructive ring-destructive' : ''}`} value={weight ?? ""} onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : null)} aria-invalid={!!weightError} aria-describedby="weight-error"/>
                {weightError && <p id="weight-error" className="text-xs text-destructive mt-1">{weightError}</p>}
              </div>

              <div>
                <Label htmlFor="height" className="text-sm font-medium text-foreground">Height (cm) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Your height in centimeters. Must be &gt; 0.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Input type="number" id="height" placeholder="e.g., 175" className={`mt-1 text-sm ${heightError ? 'border-destructive ring-destructive' : ''}`} value={height ?? ""} onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : null)} aria-invalid={!!heightError} aria-describedby="height-error"/>
                {heightError && <p id="height-error" className="text-xs text-destructive mt-1">{heightError}</p>}
              </div>

              <div>
                <Label htmlFor="age" className="text-sm font-medium text-foreground">Age (years) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Your age in years (15-100).</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Input type="number" id="age" placeholder="e.g., 30" className={`mt-1 text-sm ${ageError ? 'border-destructive ring-destructive' : ''}`} value={age ?? ""} onChange={(e) => setAge(e.target.value ? parseFloat(e.target.value) : null)} aria-invalid={!!ageError} aria-describedby="age-error"/>
                {ageError && <p id="age-error" className="text-xs text-destructive mt-1">{ageError}</p>}
              </div>

              <div>
                <Label htmlFor="bodyFat" className="text-sm font-medium text-foreground">Body Fat (%) (Optional) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>For Katch-McArdle BMR. Must be between 0-70. Leave blank if unsure to use Mifflin-St Jeor.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Input type="number" id="bodyFat" placeholder="e.g., 15" className={`mt-1 text-sm ${bodyFatError ? 'border-destructive ring-destructive' : ''}`} value={bodyFatPercentage ?? ""} onChange={(e) => setBodyFatPercentage(e.target.value ? parseFloat(e.target.value) : null)} aria-invalid={!!bodyFatError} aria-describedby="bodyfat-error"/>
                {bodyFatError && <p id="bodyfat-error" className="text-xs text-destructive mt-1">{bodyFatError}</p>}
              </div>

              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-foreground">Gender</Label>
                <Select value={gender} onValueChange={(value) => setGender(value as Gender)}>
                  <SelectTrigger id="gender" className="mt-1 text-sm"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="activity-level" className="text-sm font-medium text-foreground">Activity Level <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Sedentary: little/no exercise. Lightly Active: light exercise 1-3 days/wk. Moderately Active: moderate exercise 3-5 days/wk. Very Active: hard exercise 3-5 days/wk. Extremely Active: very hard exercise 6-7 days/wk or physical job.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Select value={activityLevel} onValueChange={(value) => setActivityLevel(value as ActivityLevel)}>
                  <SelectTrigger id="activity-level" className="mt-1 text-sm"><SelectValue placeholder="Select activity level" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(activityFactors).map((level) => (<SelectItem key={level} value={level}>{level}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="exercise-minutes" className="text-sm font-medium text-foreground">Daily Exercise Minutes <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Approx. minutes of intentional exercise per day. Used for personalized water intake. Cannot be negative.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                <Input type="number" id="exercise-minutes" placeholder="e.g., 60" className={`mt-1 text-sm ${exerciseMinutesError ? 'border-destructive ring-destructive' : ''}`} value={dailyExerciseMinutes ?? ""} onChange={(e) => setDailyExerciseMinutes(e.target.value ? parseFloat(e.target.value) : null)} aria-invalid={!!exerciseMinutesError} aria-describedby="exercise-minutes-error"/>
                {exerciseMinutesError && <p id="exercise-minutes-error" className="text-xs text-destructive mt-1">{exerciseMinutesError}</p>}
              </div>
              
              <div>
                <Label htmlFor="calorie-goal" className="text-sm font-medium text-foreground">Calorie Goal</Label>
                 <Select value={calorieGoal} onValueChange={(value) => setCalorieGoal(value as CalorieGoal)}>
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
                  <Label htmlFor="surplus-deficit" className="text-sm font-medium text-foreground">{calorieGoal === "gain" ? "Surplus" : "Deficit"} (%) <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-top text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Percentage to {calorieGoal === "gain" ? "add to" : "subtract from"} maintenance calories (10-30%). Aggressive {calorieGoal === 'gain' ? 'surpluses (>20%) may lead to more fat gain' : 'deficits (>25%) may risk muscle loss'}.</p></TooltipContent></Tooltip></TooltipProvider></Label>
                  <Slider 
                    id="surplus-deficit" 
                    value={[surplusDeficitPercentage]} 
                    max={30} 
                    min={10} 
                    step={5} 
                    onValueChange={(value) => setSurplusDeficitPercentage(value[0])} 
                    className="mt-2" 
                    aria-label={`Surplus/Deficit percentage: ${surplusDeficitPercentage}%`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Selected: {surplusDeficitPercentage}%</p>
                </div>
              )}
              
              <Button className="gradient-button w-full text-base py-2.5 mt-4" onClick={calculateCalories} disabled={isCalculating}>
                {isCalculating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : "Calculate Calories"}
              </Button>
            </div>

            {maintenanceCalories !== null && targetCalories !== null && !isCalculating && (
              <div className="mt-6 space-y-4">
                <CalorieCard title={`Maintenance ⚖️`} calories={maintenanceCalories} color="hsl(var(--bright-amber))" description="Calories to maintain your current weight."/>
                
                {calorieGoal === "gain" && (<CalorieCard title={`${calorieGoalLabelText} 🍔`} calories={targetCalories} color="hsl(var(--turquoise))" description={`Target for weight/muscle gain with ${surplusDeficitPercentage}% surplus.`}/>)}
                {calorieGoal === "lose" && (<CalorieCard title={`${calorieGoalLabelText} 🏃‍♂️`} calories={targetCalories} color="hsl(var(--coral-red))" description={`Target for weight loss with ${surplusDeficitPercentage}% deficit.`}/>)}
                {calorieGoal === "maintain" && (<CalorieCard title={`${calorieGoalLabelText} ⚖️`} calories={targetCalories} color="hsl(var(--bright-amber))" description={`Target to maintain your current weight.`}/>)}


                {(protein !== null && fat !== null && carbs !== null) && (
                  <Card className="shadow-lg rounded-2xl border-border overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg text-foreground">Macronutrient Breakdown</CardTitle>
                        <CardDescription className="text-xs">Approx. targets for your {calorieGoal} goal (High Protein approach). <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-bottom text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Protein: ~2.4g/kg, Fat: ~25% cals. Carbs: Remainder.</p></TooltipContent></Tooltip></TooltipProvider></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p><strong className="text-foreground">Protein:</strong> {protein}g</p>
                      <p><strong className="text-foreground">Fat:</strong> {fat}g</p>
                      <p><strong className="text-foreground">Carbs:</strong> {carbs}g</p>
                    </CardContent>
                  </Card>
                )}

                {waterIntake !== null && (
                  <Card className="shadow-lg rounded-2xl border-border overflow-hidden">
                    <CardHeader><CardTitle className="text-lg text-foreground">Daily Water Intake <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline-block ml-1 align-bottom text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Based on ~30ml/kg body weight + 0.5ml per minute of exercise ({dailyExerciseMinutes || 0} min).</p></TooltipContent></Tooltip></TooltipProvider></CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold" style={{color: "hsl(var(--primary))"}}>{waterIntake} ml</p>
                      <p className="text-xs text-muted-foreground">Approximate daily hydration goal.</p>
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
    <Card className="shadow-lg rounded-2xl border-border overflow-hidden transition-all hover:shadow-xl animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">{title}</CardTitle>
         {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold" style={{ color: color }}>
          {calories}
        </p>
        <p className="text-xs text-muted-foreground" style={{ color: color, opacity: 0.8 }}>Calories/day</p>
      </CardContent>
    </Card>
  );
}
