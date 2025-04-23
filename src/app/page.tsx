"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [maintenanceCalories, setMaintenanceCalories] = useState<number | null>(null);
  const [calorieSurplus, setCalorieSurplus] = useState<number | null>(null);
  const [calorieDeficit, setCalorieDeficit] = useState<number | null>(null);

  const calculateCalories = () => {
    if (weight && height && age) {
      // Mifflin-St Jeor Equation (simplified for sedentary male)
      const bmr = 10 * weight + 6.25 * height - 5 * age + 5; // Assuming age 25
      const maintenance = bmr * 1.2; // Sedentary activity factor
      setMaintenanceCalories(Math.round(maintenance));

      // Calorie Surplus (15-20% - using 17.5% as average)
      const surplus = maintenance * 1.175;
      setCalorieSurplus(Math.round(surplus));

      // Calorie Deficit (15-20% - using 17.5% as average)
      const deficit = maintenance * 0.825;
      setCalorieDeficit(Math.round(deficit));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">CalorieWise</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <p className="mb-2 text-sm">
              Enter your weight, height, and age to calculate your daily calorie needs.
              Calculations are based on the Mifflin-St Jeor equation and a sedentary activity level.
            </p>
          <div className="mb-4">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              type="number"
              id="weight"
              placeholder="Enter weight in kg"
              className="text-sm"
              onChange={(e) => setWeight(parseFloat(e.target.value))}
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              type="number"
              id="height"
              placeholder="Enter height in cm"
              className="text-sm"
              onChange={(e) => setHeight(parseFloat(e.target.value))}
            />
          </div>
           <div className="mb-4">
            <Label htmlFor="age">Age (years)</Label>
            <Input
              type="number"
              id="age"
              placeholder="Enter age in years"
              className="text-sm"
              onChange={(e) => setAge(parseFloat(e.target.value))}
            />
          </div>
          <Button className="gradient-button w-full text-sm" onClick={calculateCalories}>
            Calculate
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          {maintenanceCalories && (
            <CalorieCard
              title="Maintenance ⚖️"
              calories={maintenanceCalories}
              color="hsl(var(--bright-amber))"
            />
          )}
          {calorieSurplus && (
            <CalorieCard
              title="Gain Weight 🍔"
              calories={calorieSurplus}
              color="hsl(var(--turquoise))"
            />
          )}
          {calorieDeficit && (
            <CalorieCard
              title="Lose Weight 🏃‍♂️"
              calories={calorieDeficit}
              color="hsl(var(--coral-red))"
            />
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
