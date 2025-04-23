"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from 'react';

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
  lose: (percentage: number) => `Mild Deficit (${percentage}%)`,
  maintain: () => "Maintain Weight",
  gain: (percentage: number) => `Bulk - Surplus ${percentage}%`,
};

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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

        let proteinGrams: number;
        if (calorieGoal === "gain") {
          proteinGrams = weight * 2; // 1.6-2.2g/kg for gain (using 2 as average)
        } else {
          proteinGrams = weight * 1.4; // 1.2-1.6g/kg for maintenance/loss (using 1.4 as average)
        }
        setProtein(Math.round(proteinGrams));

        const fatCalories = maintenance * 0.25; // 20-30% of total calories (using 25% as average)
        const fatGrams = fatCalories / 9;
        setFat(Math.round(fatGrams));

        const proteinCalories = proteinGrams * 4;
        const carbsCalories = maintenance - proteinCalories - fatCalories;
        const carbsGrams = carbsCalories / 4;
        setCarbs(Math.round(carbsGrams));

        const water = weight * 35; // 35 ml per kg of body weight
        setWaterIntake(Math.round(water));
      }
      setIsCalculating(false);
    }, 500);
  };

  const calorieGoalLabel =
    calorieGoal === "maintain"
      ? calorieGoalLabels.maintain()
      : calorieGoalLabels[calorieGoal](surplusDeficitPercentage);

  return (
    <div className={`container mx-auto p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">CalorieWise</h1>
        <div className="flex items-center">
          <Label htmlFor="dark-mode" className="mr-2">Dark Mode</Label>
          <Switch id="dark-mode" checked={darkMode} onCheckedChange={(checked) => setDarkMode(checked)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-sm">
            Enter your weight, height, and age to calculate your daily calorie needs.
            Calculations are based on the Mifflin-St Jeor equation.
          </p>
          <div className="mb-2">
            <Label htmlFor="weight">
              Weight (kg)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 inline-block ml-1 align-top" />
                  </TooltipTrigger>
                  <TooltipContent>Your current weight in kilograms.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="weight"
              placeholder="Enter weight in kg"
              className="text-sm"
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              aria-invalid={!!weightError}
            />
            {weightError && <p className="text-xs text-red-500">{weightError}</p>}
          </div>
          <div className="mb-2">
            <Label htmlFor="height">
              Height (cm)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 inline-block ml-1 align-top" />
                  </TooltipTrigger>
                  <TooltipContent>Your height in centimeters.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="height"
              placeholder="Enter height in cm"
              className="text-sm"
              onChange={(e) => setHeight(parseFloat(e.target.value))}
              aria-invalid={!!heightError}
            />
            {heightError && <p className="text-xs text-red-500">{heightError}</p>}
          </div>
          <div className="mb-2">
            <Label htmlFor="age">
              Age (years)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 inline-block ml-1 align-top" />
                  </TooltipTrigger>
                  <TooltipContent>Your age in years.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="age"
              placeholder="Enter age in years"
              className="text-sm"
              onChange={(e) => setAge(parseFloat(e.target.value))}
              aria-invalid={!!ageError}
            />
            {ageError && <p className="text-xs text-red-500">{ageError}</p>}
          </div>
          <div className="mb-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={(value) => setGender(value as "male" | "female")} className="text-sm">
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-2">
            <Label htmlFor="activity-level">Activity Level</Label>
            <Select value={activityLevel} onValueChange={(value) => setActivityLevel(value as keyof typeof activityFactors)} className="text-sm">
              <SelectTrigger>
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(activityFactors).map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mb-2">
            <Label htmlFor="calorie-goal">Calorie Goal</Label>
            <Select value={calorieGoal} onValueChange={(value) => setCalorieGoal(value as "lose" | "maintain" | "gain")} className="text-sm">
              <SelectTrigger>
                <SelectValue placeholder="Select calorie goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lose">Lose Weight</SelectItem>
                <SelectItem value="maintain">Maintain Weight</SelectItem>
                <SelectItem value="gain">Gain Weight</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-2">
            <Label htmlFor="surplus-deficit">
              Surplus/Deficit (%)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 inline-block ml-1 align-top" />
                  </TooltipTrigger>
                  <TooltipContent>The percentage of calories to add (surplus) or subtract (deficit) from your maintenance calories.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Slider
              id="surplus-deficit"
              defaultValue={[surplusDeficitPercentage]}
              max={20}
              min={10}
              step={5}
              onValueChange={(value) => setSurplusDeficitPercentage(value[0])}
            />
            <p className="text-sm mt-1">Selected: {surplusDeficitPercentage}%</p>
          </div>
          <Button
            className="gradient-button w-full text-sm"
            onClick={calculateCalories}
            disabled={isCalculating}
          >
            {isCalculating ? "Calculating..." : "Calculate"}
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          {maintenanceCalories && (
            <>
              <CalorieCard
                title={`Maintenance ⚖️`}
                calories={maintenanceCalories}
                color="hsl(var(--bright-amber))"
              />
              {calorieGoal === "gain" && calorieSurplus && (
                <CalorieCard
                  title={`${calorieGoalLabels.gain(surplusDeficitPercentage)} 🍔`}
                  calories={calorieSurplus}
                  color="hsl(var(--turquoise))"
                />
              )}
              {calorieGoal === "lose" && calorieDeficit && (
                <CalorieCard
                  title={`${calorieGoalLabels.lose(surplusDeficitPercentage)} 🏃‍♂️`}
                  calories={calorieDeficit}
                  color="hsl(var(--coral-red))"
                />
              )}
              {protein && fat && carbs && (
                <Card className="shadow-md rounded-2xl">
                  <CardHeader>
                    <CardTitle>Macronutrient Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Protein: {protein}g</p>
                    <p className="text-sm">Fat: {fat}g</p>
                    <p className="text-sm">Carbs: {carbs}g</p>
                  </CardContent>
                </Card>
              )}
              {waterIntake && (
                <Card className="shadow-md rounded-2xl">
                  <CardHeader>
                    <CardTitle>Daily Water Intake</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{waterIntake} ml</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface CalorieCardProps {
  title: string;
  calories: number;
  color: string;
}

function CalorieCard({ title, calories, color }: CalorieCardProps) {
  return (
    <Card className="shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold" style={{ color: color }}>
          {calories} Calories
        </p>
      </CardContent>
    </Card>
  );
}
