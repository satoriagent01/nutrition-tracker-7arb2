import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MealPlanner } from "../src/meal-planning.js";

describe("Meal Planning - Meal Creation", () => {
  test("AC-1: Creates a meal with foods", () => {
    const planner = new MealPlanner();
    const meal = planner.createMeal("Breakfast", "2024-01-15", "08:00");

    assert.ok(meal.id);
    assert.strictEqual(meal.name, "Breakfast");
    assert.strictEqual(meal.date, "2024-01-15");
    assert.strictEqual(meal.time, "08:00");
    assert.deepStrictEqual(meal.foods, []);
  });

  test("AC-2: Adds a food to a meal", () => {
    const planner = new MealPlanner();
    const meal = planner.createMeal("Breakfast", "2024-01-15", "08:00");
    planner.addFoodToMeal(meal.id, "food-1", 150, "g");

    assert.strictEqual(meal.foods.length, 1);
    assert.strictEqual(meal.foods[0].foodId, "food-1");
    assert.strictEqual(meal.foods[0].amount, 150);
    assert.strictEqual(meal.foods[0].unit, "g");
  });

  test("AC-3: Adds multiple foods to a meal", () => {
    const planner = new MealPlanner();
    const meal = planner.createMeal("Breakfast", "2024-01-15", "08:00");
    planner.addFoodToMeal(meal.id, "food-1", 150, "g");
    planner.addFoodToMeal(meal.id, "food-2", 200, "g");

    assert.strictEqual(meal.foods.length, 2);
  });

  test("AC-4: Removes a food from a meal", () => {
    const planner = new MealPlanner();
    const meal = planner.createMeal("Breakfast", "2024-01-15", "08:00");
    planner.addFoodToMeal(meal.id, "food-1", 150, "g");
    planner.addFoodToMeal(meal.id, "food-2", 200, "g");
    planner.removeFoodFromMeal(meal.id, "food-1");

    assert.strictEqual(meal.foods.length, 1);
    assert.strictEqual(meal.foods[0].foodId, "food-2");
  });

  test("AC-5: Updates food amount in a meal", () => {
    const planner = new MealPlanner();
    const meal = planner.createMeal("Breakfast", "2024-01-15", "08:00");
    planner.addFoodToMeal(meal.id, "food-1", 150, "g");
    planner.updateFoodAmount(meal.id, "food-1", 200, "g");

    assert.strictEqual(meal.foods[0].amount, 200);
    assert.strictEqual(meal.foods[0].unit, "g");
  });
});

describe("Meal Planning - Nutrition Aggregation", () => {
  test("AC-6: Calculates total nutrition for a meal", () => {
    const planner = new MealPlanner();
    const meal = planner.createMeal("Breakfast", "2024-01-15", "08:00");

    // Add Apple: 150g (serving 100g, 52 kcal/100g)
    planner.addFoodToMeal(meal.id, "food-1", 150, "g");
    planner.setFoodNutrition("food-1", {
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        protein: 0.3,
        fat: 0.2,
      },
    });

    // Add Banana: 120g (serving 100g, 89 kcal/100g)
    planner.addFoodToMeal(meal.id, "food-2", 120, "g");
    planner.setFoodNutrition("food-2", {
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 89 },
        carbohydrate: 22.8,
        protein: 1.1,
        fat: 0.3,
      },
    });

    const total = planner.getMealTotalNutrition(meal.id);

    // Apple 150g: 52 * 1.5 = 78 kcal, 13.8 * 1.5 = 20.7g carbs, 0.3 * 1.5 = 0.45g protein, 0.2 * 1.5 = 0.3g fat
    // Banana 120g: 89 * 1.2 = 106.8 kcal, 22.8 * 1.2 = 27.36g carbs, 1.1 * 1.2 = 1.32g protein, 0.3 * 1.2 = 0.36g fat
    // Total: 184.8 kcal, 48.06g carbs, 1.77g protein, 0.66g fat
    assert.strictEqual(total.energy.kcal, 184.8);
    assert.strictEqual(total.carbohydrate, 48.06);
    assert.strictEqual(total.protein, 1.77);
    assert.strictEqual(total.fat, 0.66);
  });

  test("AC-7: Returns zero nutrition for empty meal", () => {
    const planner = new MealPlanner();
    const meal = planner.createMeal("Breakfast", "2024-01-15", "08:00");
    const total = planner.getMealTotalNutrition(meal.id);

    assert.strictEqual(total.energy.kcal, 0);
    assert.strictEqual(total.carbohydrate, 0);
    assert.strictEqual(total.protein, 0);
    assert.strictEqual(total.fat, 0);
  });

  test("AC-8: Calculates daily nutrition from multiple meals", () => {
    const planner = new MealPlanner();

    // Breakfast
    const breakfast = planner.createMeal("Breakfast", "2024-01-15", "08:00");
    planner.addFoodToMeal(breakfast.id, "food-1", 150, "g");
    planner.setFoodNutrition("food-1", {
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        protein: 0.3,
        fat: 0.2,
      },
    });

    // Lunch
    const lunch = planner.createMeal("Lunch", "2024-01-15", "12:00");
    planner.addFoodToMeal(lunch.id, "food-2", 200, "g");
    planner.setFoodNutrition("food-2", {
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 150 },
        carbohydrate: 30,
        protein: 5,
        fat: 3,
      },
    });

    const dailyTotal = planner.getDailyNutrition("2024-01-15");

    // Breakfast: 52 * 1.5 = 78 kcal
    // Lunch: 150 * 2 = 300 kcal
    // Total: 378 kcal
    assert.strictEqual(dailyTotal.energy.kcal, 378);
  });

  test("AC-9: Returns zero for date with no meals", () => {
    const planner = new MealPlanner();
    const dailyTotal = planner.getDailyNutrition("2024-01-15");

    assert.strictEqual(dailyTotal.energy.kcal, 0);
    assert.strictEqual(dailyTotal.carbohydrate, 0);
    assert.strictEqual(dailyTotal.protein, 0);
    assert.strictEqual(dailyTotal.fat, 0);
  });
});

describe("Meal Planning - Meal Templates", () => {
  test("AC-10: Creates a meal from a template", () => {
    const planner = new MealPlanner();

    // Define a template
    planner.defineMealTemplate("Quick Breakfast", [
      { foodId: "food-1", amount: 100, unit: "g" },
      { foodId: "food-2", amount: 50, unit: "g" },
    ]);

    // Create meal from template
    const meal = planner.createMealFromTemplate("Quick Breakfast", "2024-01-15", "08:00");

    assert.strictEqual(meal.name, "Quick Breakfast");
    assert.strictEqual(meal.foods.length, 2);
    assert.strictEqual(meal.foods[0].foodId, "food-1");
    assert.strictEqual(meal.foods[1].foodId, "food-2");
  });

  test("AC-11: Returns undefined for non-existent template", () => {
    const planner = new MealPlanner();
    const meal = planner.createMealFromTemplate("Non-Existent", "2024-01-15", "08:00");

    assert.strictEqual(meal, undefined);
  });

  test("AC-12: Updates a meal template", () => {
    const planner = new MealPlanner();
    planner.defineMealTemplate("Snack", [
      { foodId: "food-1", amount: 50, unit: "g" },
    ]);

    planner.updateMealTemplate("Snack", [
      { foodId: "food-1", amount: 100, unit: "g" },
      { foodId: "food-2", amount: 50, unit: "g" },
    ]);

    const meal = planner.createMealFromTemplate("Snack", "2024-01-15", "10:00");
    assert.strictEqual(meal.foods.length, 2);
    assert.strictEqual(meal.foods[0].amount, 100);
  });
});

describe("Meal Planning - Daily Goals", () => {
  test("AC-13: Checks if daily goals are met", () => {
    const planner = new MealPlanner();
    planner.setDailyGoals({
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
    });

    // Add a meal that exceeds goals
    const meal = planner.createMeal("Big Meal", "2024-01-15", "12:00");
    planner.addFoodToMeal(meal.id, "food-1", 1000, "g");
    planner.setFoodNutrition("food-1", {
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 500 },
        carbohydrate: 50,
        protein: 30,
        fat: 20,
      },
    });

    const status = planner.getDailyGoalStatus("2024-01-15");

    assert.ok(status.caloriesExceeded);
    assert.ok(status.proteinExceeded);
    assert.ok(status.carbsExceeded);
    assert.ok(status.fatExceeded);
  });

  test("AC-14: Returns all false when under goals", () => {
    const planner = new MealPlanner();
    planner.setDailyGoals({
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
    });

    const status = planner.getDailyGoalStatus("2024-01-15");

    assert.strictEqual(status.caloriesExceeded, false);
    assert.strictEqual(status.proteinExceeded, false);
    assert.strictEqual(status.carbsExceeded, false);
    assert.strictEqual(status.fatExceeded, false);
  });
});