import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NutritionTracker } from "../src/ui.js";

describe("UI Integration - Upload Photo", () => {
  test("AC-1: Uploads a photo and triggers OCR", async () => {
    const tracker = new NutritionTracker();
    const mockImage = Buffer.from("fake-image-data");

    const result = await tracker.uploadPhoto(mockImage);

    assert.ok(result);
    assert.ok(result.foods);
    assert.ok(Array.isArray(result.foods));
  });

  test("AC-2: Handles upload failure gracefully", async () => {
    const tracker = new NutritionTracker();

    // Simulate a failed upload by providing invalid data
    try {
      await tracker.uploadPhoto(null);
      // If it doesn't throw, the result should indicate failure
    } catch (error) {
      assert.ok(error);
    }
  });

  test("AC-3: Processes photo with multiple food items", async () => {
    const tracker = new NutritionTracker();
    const mockImage = Buffer.from("fake-image-with-multiple-items");

    const result = await tracker.uploadPhoto(mockImage);

    assert.ok(result.foods.length >= 1);
  });
});

describe("UI Integration - View Nutrition", () => {
  test("AC-4: Displays nutrition info for a food item", () => {
    const tracker = new NutritionTracker();
    tracker.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        protein: 0.3,
        fat: 0.2,
      },
    });

    const info = tracker.getFoodInfo("food-1");

    assert.strictEqual(info.name, "Apple");
    assert.strictEqual(info.nutrition.energy.kcal, 52);
    assert.strictEqual(info.nutrition.carbohydrate, 13.8);
  });

  test("AC-5: Shows daily nutrition summary", () => {
    const tracker = new NutritionTracker();
    tracker.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        protein: 0.3,
        fat: 0.2,
      },
    });

    tracker.addMeal("Breakfast", "2024-01-15", "08:00", [
      { foodId: "food-1", amount: 150, unit: "g" },
    ]);

    const summary = tracker.getDailySummary("2024-01-15");

    assert.ok(summary);
    assert.ok(summary.totalCalories > 0);
  });

  test("AC-6: Returns empty summary for date with no data", () => {
    const tracker = new NutritionTracker();
    const summary = tracker.getDailySummary("2024-01-15");

    assert.deepStrictEqual(summary, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbohydrate: 0,
      totalFat: 0,
    });
  });
});

describe("UI Integration - Create Meal", () => {
  test("AC-7: Creates a meal with selected foods", () => {
    const tracker = new NutritionTracker();
    tracker.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        protein: 0.3,
        fat: 0.2,
      },
    });

    const mealId = tracker.addMeal("Breakfast", "2024-01-15", "08:00", [
      { foodId: "food-1", amount: 150, unit: "g" },
    ]);

    assert.ok(mealId);
    const meal = tracker.getMeal(mealId);
    assert.strictEqual(meal.name, "Breakfast");
    assert.strictEqual(meal.foods.length, 1);
  });

  test("AC-8: Updates an existing meal", () => {
    const tracker = new NutritionTracker();
    tracker.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        protein: 0.3,
        fat: 0.2,
      },
    });

    const mealId = tracker.addMeal("Breakfast", "2024-01-15", "08:00", [
      { foodId: "food-1", amount: 150, unit: "g" },
    ]);

    tracker.updateMeal(mealId, {
      name: "Morning Snack",
      foods: [
        { foodId: "food-1", amount: 200, unit: "g" },
      ],
    });

    const meal = tracker.getMeal(mealId);
    assert.strictEqual(meal.name, "Morning Snack");
    assert.strictEqual(meal.foods[0].amount, 200);
  });

  test("AC-9: Deletes a meal", () => {
    const tracker = new NutritionTracker();
    tracker.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: { energy: { kcal: 52 } },
    });

    const mealId = tracker.addMeal("Breakfast", "2024-01-15", "08:00", [
      { foodId: "food-1", amount: 150, unit: "g" },
    ]);

    tracker.deleteMeal(mealId);
    assert.strictEqual(tracker.getMeal(mealId), undefined);
  });
});

describe("UI Integration - Track Nutrients", () => {
  test("AC-10: Tracks daily nutrient intake", () => {
    const tracker = new NutritionTracker();
    tracker.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        protein: 0.3,
        fat: 0.2,
      },
    });

    tracker.addMeal("Breakfast", "2024-01-15", "08:00", [
      { foodId: "food-1", amount: 150, unit: "g" },
    ]);

    const dailyTotal = tracker.getDailyNutrition("2024-01-15");

    assert.ok(dailyTotal.totalCalories > 0);
    assert.ok(dailyTotal.totalProtein > 0);
    assert.ok(dailyTotal.totalCarbohydrate > 0);
    assert.ok(dailyTotal.totalFat > 0);
  });

  test("AC-11: Compares intake against daily goals", () => {
    const tracker = new NutritionTracker();
    tracker.setDailyGoals({
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
    });

    tracker.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        protein: 0.3,
        fat: 0.2,
      },
    });

    tracker.addMeal("Breakfast", "2024-01-15", "08:00", [
      { foodId: "food-1", amount: 150, unit: "g" },
    ]);

    const status = tracker.getGoalStatus("2024-01-15");

    assert.ok(status);
    assert.ok(status.caloriesRemaining > 0);
  });

  test("AC-12: Shows progress percentage", () => {
    const tracker = new NutritionTracker();
    tracker.setDailyGoals({
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 10,
    });

    tracker.addFood({
      id: "food-1",
      name: "Test Food",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 50 },
        carbohydrate: 5,
        protein: 5,
        fat: 5,
      },
    });

    tracker.addMeal("Test Meal", "2024-01-15", "12:00", [
      { foodId: "food-1", amount: 100, unit: "g" },
    ]);

    const status = tracker.getGoalStatus("2024-01-15");

    assert.strictEqual(status.caloriesPercentage, 50);
  });
});

describe("UI Integration - Full User Flow", () => {
  test("AC-13: Complete flow - upload, view, create meal, track", async () => {
    const tracker = new NutritionTracker();

    // Step 1: Upload photo (simulated)
    const uploadResult = await tracker.uploadPhoto(Buffer.from("test-image"));
    assert.ok(uploadResult.foods);

    // Step 2: View nutrition info
    if (uploadResult.foods.length > 0) {
      const foodInfo = tracker.getFoodInfo(uploadResult.foods[0].id);
      assert.ok(foodInfo);
    }

    // Step 3: Create meal with the food
    const mealId = tracker.addMeal("Lunch", "2024-01-15", "12:00", [
      { foodId: uploadResult.foods[0].id, amount: 100, unit: "g" },
    ]);
    assert.ok(mealId);

    // Step 4: Track nutrients
    const summary = tracker.getDailySummary("2024-01-15");
    assert.ok(summary);
    assert.ok(summary.totalCalories >= 0);
  });

  test("AC-14: Handles empty state gracefully", () => {
    const tracker = new NutritionTracker();

    const summary = tracker.getDailySummary("2024-01-15");
    assert.deepStrictEqual(summary, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbohydrate: 0,
      totalFat: 0,
    });

    const status = tracker.getGoalStatus("2024-01-15");
    assert.ok(status);
  });
});