import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Storage } from "../src/storage.js";

describe("Storage - Food CRUD", () => {
  test("AC-1: Creates a new food entry", () => {
    const storage = new Storage();
    const food = {
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        sugar: 10.4,
        fiber: 2.4,
        protein: 0.3,
        fat: 0.2,
      },
    };

    storage.addFood(food);
    const retrieved = storage.getFood("food-1");

    assert.strictEqual(retrieved.name, "Apple");
    assert.strictEqual(retrieved.servingSize, 100);
    assert.deepStrictEqual(retrieved.nutrition, food.nutrition);
  });

  test("AC-2: Updates an existing food entry", () => {
    const storage = new Storage();
    const food = {
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
      },
    };

    storage.addFood(food);

    const updatedFood = {
      id: "food-1",
      name: "Apple (Red)",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: { kcal: 52 },
        carbohydrate: 13.8,
        sugar: 10.4,
      },
    };

    storage.updateFood(updatedFood);
    const retrieved = storage.getFood("food-1");

    assert.strictEqual(retrieved.name, "Apple (Red)");
    assert.strictEqual(retrieved.nutrition.sugar, 10.4);
  });

  test("AC-3: Deletes a food entry", () => {
    const storage = new Storage();
    const food = {
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: { energy: { kcal: 52 } },
    };

    storage.addFood(food);
    storage.deleteFood("food-1");

    const retrieved = storage.getFood("food-1");
    assert.strictEqual(retrieved, undefined);
  });

  test("AC-4: Lists all foods", () => {
    const storage = new Storage();
    storage.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: { energy: { kcal: 52 } },
    });
    storage.addFood({
      id: "food-2",
      name: "Banana",
      servingSize: 100,
      servingUnit: "g",
      nutrition: { energy: { kcal: 89 } },
    });

    const foods = storage.listFoods();

    assert.strictEqual(foods.length, 2);
    assert.strictEqual(foods[0].name, "Apple");
    assert.strictEqual(foods[1].name, "Banana");
  });

  test("AC-5: Returns undefined for non-existent food", () => {
    const storage = new Storage();
    const retrieved = storage.getFood("non-existent");
    assert.strictEqual(retrieved, undefined);
  });

  test("AC-6: Handles duplicate food IDs (update behavior)", () => {
    const storage = new Storage();
    storage.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: { energy: { kcal: 52 } },
    });
    storage.addFood({
      id: "food-1",
      name: "Apple (Green)",
      servingSize: 100,
      servingUnit: "g",
      nutrition: { energy: { kcal: 56 } },
    });

    const foods = storage.listFoods();
    assert.strictEqual(foods.length, 1);
    assert.strictEqual(foods[0].name, "Apple (Green)");
  });
});

describe("Storage - Meal CRUD", () => {
  test("AC-7: Creates a new meal entry", () => {
    const storage = new Storage();
    const meal = {
      id: "meal-1",
      name: "Breakfast",
      time: "08:00",
      date: "2024-01-15",
      foods: [
        { foodId: "food-1", amount: 150, unit: "g" },
        { foodId: "food-2", amount: 200, unit: "g" },
      ],
    };

    storage.addMeal(meal);
    const retrieved = storage.getMeal("meal-1");

    assert.strictEqual(retrieved.name, "Breakfast");
    assert.strictEqual(retrieved.foods.length, 2);
  });

  test("AC-8: Updates an existing meal", () => {
    const storage = new Storage();
    storage.addMeal({
      id: "meal-1",
      name: "Breakfast",
      time: "08:00",
      date: "2024-01-15",
      foods: [{ foodId: "food-1", amount: 150, unit: "g" }],
    });

    storage.updateMeal({
      id: "meal-1",
      name: "Morning Snack",
      time: "10:00",
      date: "2024-01-15",
      foods: [
        { foodId: "food-1", amount: 150, unit: "g" },
        { foodId: "food-2", amount: 100, unit: "g" },
      ],
    });

    const retrieved = storage.getMeal("meal-1");
    assert.strictEqual(retrieved.name, "Morning Snack");
    assert.strictEqual(retrieved.foods.length, 2);
  });

  test("AC-9: Deletes a meal", () => {
    const storage = new Storage();
    storage.addMeal({
      id: "meal-1",
      name: "Breakfast",
      time: "08:00",
      date: "2024-01-15",
      foods: [],
    });

    storage.deleteMeal("meal-1");
    assert.strictEqual(storage.getMeal("meal-1"), undefined);
  });

  test("AC-10: Lists meals by date", () => {
    const storage = new Storage();
    storage.addMeal({
      id: "meal-1",
      name: "Breakfast",
      time: "08:00",
      date: "2024-01-15",
      foods: [],
    });
    storage.addMeal({
      id: "meal-2",
      name: "Lunch",
      time: "12:00",
      date: "2024-01-15",
      foods: [],
    });
    storage.addMeal({
      id: "meal-3",
      name: "Dinner",
      time: "18:00",
      date: "2024-01-16",
      foods: [],
    });

    const meals = storage.listMeals("2024-01-15");
    assert.strictEqual(meals.length, 2);
    assert.strictEqual(meals[0].name, "Breakfast");
    assert.strictEqual(meals[1].name, "Lunch");
  });

  test("AC-11: Returns empty array for date with no meals", () => {
    const storage = new Storage();
    const meals = storage.listMeals("2024-01-15");
    assert.deepStrictEqual(meals, []);
  });
});

describe("Storage - Preferences", () => {
  test("AC-12: Sets and retrieves user preferences", () => {
    const storage = new Storage();
    const prefs = {
      dailyCalorieTarget: 2000,
      dailyProteinTarget: 150,
      dailyCarbTarget: 250,
      dailyFatTarget: 65,
      dietaryRestrictions: ["gluten-free"],
    };

    storage.setPreferences(prefs);
    const retrieved = storage.getPreferences();

    assert.strictEqual(retrieved.dailyCalorieTarget, 2000);
    assert.strictEqual(retrieved.dailyProteinTarget, 150);
    assert.deepStrictEqual(retrieved.dietaryRestrictions, ["gluten-free"]);
  });

  test("AC-13: Returns default preferences when none set", () => {
    const storage = new Storage();
    const retrieved = storage.getPreferences();

    assert.strictEqual(retrieved.dailyCalorieTarget, 2000);
    assert.strictEqual(retrieved.dailyProteinTarget, 50);
    assert.strictEqual(retrieved.dailyCarbTarget, 250);
    assert.strictEqual(retrieved.dailyFatTarget, 65);
    assert.deepStrictEqual(retrieved.dietaryRestrictions, []);
  });

  test("AC-14: Updates preferences partially", () => {
    const storage = new Storage();
    storage.setPreferences({
      dailyCalorieTarget: 2500,
      dailyProteinTarget: 200,
      dailyCarbTarget: 300,
      dailyFatTarget: 80,
      dietaryRestrictions: ["vegan"],
    });

    storage.updatePreferences({ dailyCalorieTarget: 2200 });
    const retrieved = storage.getPreferences();

    assert.strictEqual(retrieved.dailyCalorieTarget, 2200);
    assert.strictEqual(retrieved.dailyProteinTarget, 200);
    assert.strictEqual(retrieved.dietaryRestrictions[0], "vegan");
  });
});

describe("Storage - Daily Summary", () => {
  test("AC-15: Calculates daily nutrition summary from meals", () => {
    const storage = new Storage();
    storage.addFood({
      id: "food-1",
      name: "Apple",
      servingSize: 100,
      servingUnit: "g",
      nutrition: { energy: { kcal: 52 }, carbohydrate: 13.8, protein: 0.3, fat: 0.2 },
    });
    storage.addFood({
      id: "food-2",
      name: "Banana",
      servingSize: 100,
      servingUnit: "g",
      nutrition: { energy: { kcal: 89 }, carbohydrate: 22.8, protein: 1.1, fat: 0.3 },
    });

    storage.addMeal({
      id: "meal-1",
      name: "Breakfast",
      time: "08:00",
      date: "2024-01-15",
      foods: [
        { foodId: "food-1", amount: 150, unit: "g" },
        { foodId: "food-2", amount: 120, unit: "g" },
      ],
    });

    const summary = storage.getDailySummary("2024-01-15");

    assert.ok(summary);
    assert.ok(summary.totalCalories > 0);
    assert.ok(summary.totalProtein > 0);
    assert.ok(summary.totalCarbohydrate > 0);
    assert.ok(summary.totalFat > 0);
  });

  test("AC-16: Returns empty summary for date with no meals", () => {
    const storage = new Storage();
    const summary = storage.getDailySummary("2024-01-15");

    assert.deepStrictEqual(summary, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbohydrate: 0,
      totalFat: 0,
    });
  });
});