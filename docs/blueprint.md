# **App Name**: CalorieWise

## Core Features:

- Input Fields: Input fields for weight (kg) and height (cm), and a calculate button. Optional: Age, Gender, Activity Level
- Calorie Calculation Logic: Calculates maintenance calories using the Mifflin-St Jeor Equation and suggests calorie surplus/deficit based on user input (15-20%).
- Result Display: Display maintenance calories, calorie surplus (for weight gain), and calorie deficit (for weight loss) in stylized card components. Use icons/emojis for Gain (🍔), Maintenance (⚖️), and Loss (🏃‍♂️).

## Style Guidelines:

- Background Gradient: linear-gradient(to bottom, #FFF5E1, #FFE6F7) – a warm peach-to-pink blend.
- Primary Cards: White (#FFFFFF) with soft shadows and rounded corners (20px).
- Accent Colors: Vibrant Turquoise (#00C9A7), Coral Red (#FF6B6B), and Bright Amber (#FFC107) for calorie cards.
- Buttons: Gradient: linear-gradient(135deg, #00C9A7, #FFC107) with bold text.
- Text: Use deep charcoal (#333333) for readability. Calorie numbers in bold vibrant tones matching the card type.
- Typography: Rounded, modern font (e.g., Poppins, Inter).
- Icons/Illustrations: Use line icons or emojis for a fun, fitness-themed feel.

## Original User Request:
Build a simple mobile app where users can input their **weight (in kg)** and **height (in cm)**. The app should then calculate and display:

1. **Maintenance Calories** – using the Mifflin-St Jeor Equation (with default settings assuming sedentary activity and male gender unless otherwise specified).
2. **Calories to Gain Weight** – suggest a **15–20% surplus** over maintenance calories.
3. **Calories to Lose Weight** – suggest a **15–20% deficit** from maintenance calories.

### Functional Requirements:
- Input fields for:
  - Weight (kg)
  - Height (cm)
- A **"Calculate" button** to compute:
  - Maintenance Calories
  - Calorie Surplus (for weight gain)
  - Calorie Deficit (for weight loss)
- Display the three calorie values in a clean, card-style layout.

### Optional Enhancements:
- Option to input age and gender for more accurate results.
- Toggle for activity level (Sedentary, Light, Moderate, Active, Very Active).
- Store user data locally or in Firestore for later reference.

### Design Requirements:
- Clean and minimal UI.
- Use Firebase for app logic, storage (if needed), and hosting.
- Compatible with Android and iOS (Flutter preferred if applicable).
  