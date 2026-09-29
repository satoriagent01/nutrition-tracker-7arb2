import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  loadFoods,
  saveFood,
  loadMeals,
  saveMeal,
  loadPrefs,
  savePrefs,
} from "../src/storage.js";

describe("storage module", () => {
  // Helper to create a mock storage object
  function createMockStorage() {
    const store = new Map();
    return {
      getItem(key) {
        const val = store.get(key);
        return val !== undefined ? val : null;
      },
      setItem(key, value) {
        store.set(key, value);
      },
    };
  }

  describe("saveFood / loadFoods", () => {
    test("saves and loads a food item", () => {
      const storage = createMockStorage();
      const food = {
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
      };

      saveFood(storage, food);
      const foods = loadFoods(storage);

      assert.strictEqual(foods.length, 1);
      assert.deepStrictEqual(foods[0], food);
    });

    test("saves multiple food items", () => {
      const storage = createMockStorage();
      const food1 = {
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
      };
      const food2 = {
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
      };

      saveFood(storage, food1);
      saveFood(storage, food2);
      const foods = loadFoods(storage);

      assert.strictEqual(foods.length, 2);
      assert.strictEqual(foods[0].id, "food-1");
      assert.strictEqual(foods[1].id, "food-2");
    });

    test("returns empty array when no foods saved", () => {
      const storage = createMockStorage();
      const foods = loadFoods(storage);
      assert.deepStrictEqual(foods, []);
    });

    test("overwrites food with same id", () => {
      const storage = createMockStorage();
      const food1 = {
        id: "food-1",
        name: "Old Name",
        energy: 100,
        fat: 5,
        saturatedFat: 2,
        carbohydrates: 10,
        sugars: 5,
        fiber: 1,
        protein: 2,
        salt: 0.1,
        servingSize: 30,
      };
      const food2 = {
        id: "food-1",
        name: "New Name",
        energy: 200,
        fat: 10,
        saturatedFat: 4,
        carbohydrates: 20,
        sugars: 10,
        fiber: 2,
        protein: 4,
        salt: 0.2,
        servingSize: 50,
      };

      saveFood(storage, food1);
      saveFood(storage, food2);
      const foods = loadFoods(storage);

      assert.strictEqual(foods.length, 1);
      assert.strictEqual(foods[0].name, "New Name");
      assert.strictEqual(foods[0].energy, 200);
    });
  });

  describe("saveMeal / loadMeals", () => {
    test("saves and loads a meal", () => {
      const storage = createMockStorage();
      const meal = {
        id: "meal-1",
        name: "Breakfast",
        items: [
          { foodId: "food-1", grams: 30 },
          { foodId: "food-2", grams: 200 },
        ],
      };

      saveMeal(storage, meal);
      const meals = loadMeals(storage);

      assert.strictEqual(meals.length, 1);
      assert.deepStrictEqual(meals[0], meal);
    });

    test("saves multiple meals", () => {
      const storage = createMockStorage();
      const meal1 = {
        id: "meal-1",
        name: "Breakfast",
        items: [{ foodId: "food-1", grams: 30 }],
      };
      const meal2 = {
        id: "meal-2",
        name: "Lunch",
        items: [{ foodId: "food-2", grams: 200 }],
      };

      saveMeal(storage, meal1);
      saveMeal(storage, meal2);
      const meals = loadMeals(storage);

      assert.strictEqual(meals.length, 2);
      assert.strictEqual(meals[0].name, "Breakfast");
      assert.strictEqual(meals[1].name, "Lunch");
    });

    test("returns empty array when no meals saved", () => {
      const storage = createMockStorage();
      const meals = loadMeals(storage);
      assert.deepStrictEqual(meals, []);
    });

    test("overwrites meal with same id", () => {
      const storage = createMockStorage();
      const meal1 = {
        id: "meal-1",
        name: "Old Meal",
        items: [{ foodId: "food-1", grams: 30 }],
      };
      const meal2 = {
        id: "meal-1",
        name: "New Meal",
        items: [{ foodId: "food-2", grams: 100 }],
      };

      saveMeal(storage, meal1);
      saveMeal(storage, meal2);
      const meals = loadMeals(storage);

      assert.strictEqual(meals.length, 1);
      assert.strictEqual(meals[0].name, "New Meal");
      assert.strictEqual(meals[0].items[0].foodId, "food-2");
    });
  });

  describe("savePrefs / loadPrefs", () => {
    test("saves and loads preferences", () => {
      const storage = createMockStorage();
      const prefs = {
        trackedNutrients: ["energy", "fat", "saturatedFat", "sugars"],
        defaultServingUnit: "g",
      };

      savePrefs(storage, prefs);
      const loaded = loadPrefs(storage);

      assert.deepStrictEqual(loaded, prefs);
    });

    test("returns default preferences when none saved", () => {
      const storage = createMockStorage();
      const prefs = loadPrefs(storage);

      assert.deepStrictEqual(prefs, {
        trackedNutrients: ["energy", "fat", "saturatedFat", "sugars"],
        defaultServingUnit: "g",
      });
    });

    test("overwrites existing preferences", () => {
      const storage = createMockStorage();
      const prefs1 = {
        trackedNutrients: ["energy"],
        defaultServingUnit: "ml",
      };
      const prefs2 = {
        trackedNutrients: ["energy", "protein"],
        defaultServingUnit: "g",
      };

      savePrefs(storage, prefs1);
      savePrefs(storage, prefs2);
      const loaded = loadPrefs(storage);

      assert.deepStrictEqual(loaded, prefs2);
    });
  });

  describe("storage isolation", () => {
    test("different storage instances are independent", () => {
      const storage1 = createMockStorage();
      const storage2 = createMockStorage();

      const food = {
        id: "food-1",
        name: "Test Food",
        energy: 100,
        fat: 5,
        saturatedFat: 2,
        carbohydrates: 10,
        sugars: 5,
        fiber: 1,
        protein: 2,
        salt: 0.1,
        servingSize: 30,
      };

      saveFood(storage1, food);
      const foods1 = loadFoods(storage1);
      const foods2 = loadFoods(storage2);

      assert.strictEqual(foods1.length, 1);
      assert.strictEqual(foods2.length, 0);
    });
  });
});