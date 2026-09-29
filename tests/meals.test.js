import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createMeal, getMealTotal, getDailyTotal } from "../src/meals.js";

describe("meal planning", () => {
  // Helper to create a mock food database
  function createFoodDb() {
    return {
      "food-1": {
        id: "food-1",
        name: "Hazelnut Chocolate Bar",
        energy: 2292,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
        servingSize: 30,
      },
      "food-2": {
        id: "food-2",
        name: "Apple Juice",
        energy: 199,
        fat: 0,
        saturatedFat: 0,
        carbohydrates: 11,
        sugars: 10,
        fiber: 0.7,
        protein: 0.4,
        salt: 0,
        servingSize: 200,
      },
      "food-3": {
        id: "food-3",
        name: "Olive Oil",
        energy: 3404,
        fat: 100,
        saturatedFat: 14,
        carbohydrates: 0,
        sugars: 0,
        fiber: 0,
        protein: 0,
        salt: 0,
        servingSize: 100,
      },
    };
  }

  describe("createMeal", () => {
    test("creates a meal with items", () => {
      const meal = createMeal("Breakfast", [
        { foodId: "food-1", grams: 30 },
        { foodId: "food-2", grams: 200 },
      ]);

      assert.ok(meal.id);
      assert.strictEqual(meal.name, "Breakfast");
      assert.strictEqual(meal.items.length, 2);
      assert.strictEqual(meal.items[0].foodId, "food-1");
      assert.strictEqual(meal.items[0].grams, 30);
      assert.strictEqual(meal.items[1].foodId, "food-2");
      assert.strictEqual(meal.items[1].grams, 200);
    });

    test("creates a meal with a single item", () => {
      const meal = createMeal("Snack", [
        { foodId: "food-3", grams: 10 },
      ]);

      assert.strictEqual(meal.name, "Snack");
      assert.strictEqual(meal.items.length, 1);
      assert.strictEqual(meal.items[0].grams, 10);
    });

    test("creates a meal with no items", () => {
      const meal = createMeal("Empty Meal", []);

      assert.strictEqual(meal.name, "Empty Meal");
      assert.strictEqual(meal.items.length, 0);
    });

    test("generates unique IDs for different meals", () => {
      const meal1 = createMeal("Meal 1", []);
      const meal2 = createMeal("Meal 2", []);

      assert.notStrictEqual(meal1.id, meal2.id);
    });
  });

  describe("getMealTotal", () => {
    test("calculates total nutrition for a meal", () => {
      const foodDb = createFoodDb();
      const meal = createMeal("Breakfast", [
        { foodId: "food-1", grams: 30 },
        { foodId: "food-2", grams: 200 },
      ]);

      const total = getMealTotal(meal, foodDb);

      // food-1: 30g -> energy: 687.6, fat: 9.9, satFat: 3.9, carbs: 16.5, sugars: 13.5, fiber: 0.72, protein: 2.04, salt: 0.054
      // food-2: 200g -> energy: 398, fat: 0, satFat: 0, carbs: 22, sugars: 20, fiber: 1.4, protein: 0.8, salt: 0
      assert.strictEqual(total.energy, 1085.6);
      assert.strictEqual(total.fat, 9.9);
      assert.strictEqual(total.saturatedFat, 3.9);
      assert.strictEqual(total.carbohydrates, 38.5);
      assert.strictEqual(total.sugars, 33.5);
      assert.strictEqual(total.fiber, 2.12);
      assert.strictEqual(total.protein, 2.84);
      assert.strictEqual(total.salt, 0.054);
    });

    test("calculates total for a single item meal", () => {
      const foodDb = createFoodDb();
      const meal = createMeal("Snack", [
        { foodId: "food-3", grams: 10 },
      ]);

      const total = getMealTotal(meal, foodDb);

      // food-3: 10g -> energy: 340.4, fat: 10, satFat: 1.4, carbs: 0, sugars: 0, fiber: 0, protein: 0, salt: 0
      assert.strictEqual(total.energy, 340.4);
      assert.strictEqual(total.fat, 10);
      assert.strictEqual(total.saturatedFat, 1.4);
      assert.strictEqual(total.carbohydrates, 0);
      assert.strictEqual(total.sugars, 0);
      assert.strictEqual(total.fiber, 0);
      assert.strictEqual(total.protein, 0);
      assert.strictEqual(total.salt, 0);
    });

    test("returns zeros for empty meal", () => {
      const foodDb = createFoodDb();
      const meal = createMeal("Empty", []);

      const total = getMealTotal(meal, foodDb);

      assert.strictEqual(total.energy, 0);
      assert.strictEqual(total.fat, 0);
      assert.strictEqual(total.saturatedFat, 0);
      assert.strictEqual(total.carbohydrates, 0);
      assert.strictEqual(total.sugars, 0);
      assert.strictEqual(total.fiber, 0);
      assert.strictEqual(total.protein, 0);
      assert.strictEqual(total.salt, 0);
    });

    test("handles missing food in database", () => {
      const foodDb = createFoodDb();
      const meal = createMeal("Incomplete", [
        { foodId: "food-1", grams: 30 },
        { foodId: "food-999", grams: 50 },
      ]);

      const total = getMealTotal(meal, foodDb);

      // Only food-1 contributes; food-999 is missing
      assert.strictEqual(total.energy, 687.6);
      assert.strictEqual(total.fat, 9.9);
    });

    test("handles zero grams", () => {
      const foodDb = createFoodDb();
      const meal = createMeal("Zero", [
        { foodId: "food-1", grams: 0 },
        { foodId: "food-2", grams: 200 },
      ]);

      const total = getMealTotal(meal, foodDb);

      // food-1: 0g -> all zeros
      // food-2: 200g -> energy: 398, fat: 0, satFat: 0, carbs: 22, sugars: 20, fiber: 1.4, protein: 0.8, salt: 0
      assert.strictEqual(total.energy, 398);
      assert.strictEqual(total.fat, 0);
      assert.strictEqual(total.saturatedFat, 0);
      assert.strictEqual(total.carbohydrates, 22);
      assert.strictEqual(total.sugars, 20);
      assert.strictEqual(total.fiber, 1.4);
      assert.strictEqual(total.protein, 0.8);
      assert.strictEqual(total.salt, 0);
    });
  });

  describe("getDailyTotal", () => {
    test("aggregates totals across multiple meals", () => {
      const foodDb = createFoodDb();
      const meals = [
        createMeal("Breakfast", [
          { foodId: "food-1", grams: 30 },
        ]),
        createMeal("Lunch", [
          { foodId: "food-2", grams: 200 },
        ]),
        createMeal("Snack", [
          { foodId: "food-3", grams: 10 },
        ]),
      ];

      const total = getDailyTotal(meals, foodDb, [
        "energy",
        "fat",
        "saturatedFat",
        "carbohydrates",
        "sugars",
        "fiber",
        "protein",
        "salt",
      ]);

      // Breakfast (30g food-1): energy: 687.6, fat: 9.9, satFat: 3.9, carbs: 16.5, sugars: 13.5, fiber: 0.72, protein: 2.04, salt: 0.054
      // Lunch (200g food-2): energy: 398, fat: 0, satFat: 0, carbs: 22, sugars: 20, fiber: 1.4, protein: 0.8, salt: 0
      // Snack (10g food-3): energy: 340.4, fat: 10, satFat: 1.4, carbs: 0, sugars: 0, fiber: 0, protein: 0, salt: 0
      // Total: energy: 1426, fat: 19.9, satFat: 5.3, carbs: 38.5, sugars: 33.5, fiber: 2.12, protein: 2.84, salt: 0.054

      assert.strictEqual(total.energy, 1426);
      assert.strictEqual(total.fat, 19.9);
      assert.strictEqual(total.saturatedFat, 5.3);
      assert.strictEqual(total.carbohydrates, 38.5);
      assert.strictEqual(total.sugars, 33.5);
      assert.strictEqual(total.fiber, 2.12);
      assert.strictEqual(total.protein, 2.84);
      assert.strictEqual(total.salt, 0.054);
    });

    test("filters by tracked nutrients", () => {
      const foodDb = createFoodDb();
      const meals = [
        createMeal("Breakfast", [
          { foodId: "food-1", grams: 30 },
        ]),
      ];

      const total = getDailyTotal(meals, foodDb, ["energy", "sugars"]);

      assert.strictEqual(total.energy, 687.6);
      assert.strictEqual(total.sugars, 13.5);
      assert.strictEqual(total.fat, undefined);
      assert.strictEqual(total.saturatedFat, undefined);
    });

    test("returns zeros for no meals", () => {
      const foodDb = createFoodDb();
      const total = getDailyTotal([], foodDb, [
        "energy",
        "fat",
        "saturatedFat",
        "carbohydrates",
        "sugars",
        "fiber",
        "protein",
        "salt",
      ]);

      assert.strictEqual(total.energy, 0);
      assert.strictEqual(total.fat, 0);
      assert.strictEqual(total.saturatedFat, 0);
      assert.strictEqual(total.carbohydrates, 0);
      assert.strictEqual(total.sugars, 0);
      assert.strictEqual(total.fiber, 0);
      assert.strictEqual(total.protein, 0);
      assert.strictEqual(total.salt, 0);
    });

    test("handles meals with missing foods", () => {
      const foodDb = createFoodDb();
      const meals = [
        createMeal("Incomplete", [
          { foodId: "food-999", grams: 100 },
        ]),
      ];

      const total = getDailyTotal(meals, foodDb, [
        "energy",
        "fat",
        "saturatedFat",
        "carbohydrates",
        "sugars",
        "fiber",
        "protein",
        "salt",
      ]);

      assert.strictEqual(total.energy, 0);
      assert.strictEqual(total.fat, 0);
    });
  });
});