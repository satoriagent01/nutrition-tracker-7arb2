import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseNutritionTable } from "../src/ocr.js";
import { scaleNutrition } from "../src/nutrition.js";
import { createMeal, getMealTotal } from "../src/meals.js";
import { Storage } from "../src/storage.js";

describe("UI Integration - Upload Photo (OCR)", () => {
  test("AC-1: Parses OCR text from a nutrition label", () => {
    const ocrText = `
      Nutrition Information
      Per 100g
      Energy 2292 kJ / 545 kcal
      Fat 33 g
      of which saturates 13 g
      Carbohydrate 55 g
      of which sugars 45 g
      Fibre 2.4 g
      Protein 6.8 g
      Salt 0.18 g
    `;

    const result = parseNutritionTable(ocrText);

    assert.ok(result);
    assert.strictEqual(result.energy.per100g, 2292);
    assert.strictEqual(result.fat.per100g, 33);
    assert.strictEqual(result.saturatedFat.per100g, 13);
    assert.strictEqual(result.carbohydrates.per100g, 55);
    assert.strictEqual(result.sugars.per100g, 45);
    assert.strictEqual(result.fiber.per100g, 2.4);
    assert.strictEqual(result.protein.per100g, 6.8);
    assert.strictEqual(result.salt.per100g, 0.18);
  });

  test("AC-2: Handles multi-language nutrient names", () => {
    const ocrText = `
      Nährwerttabelle
      Energie 2292 kJ / 545 kcal
      Fett 33 g
      Kohlenhydrate 55 g
      Zucker 45 g
      Eiweiss 6.8 g
      Salz 0.18 g
    `;

    const result = parseNutritionTable(ocrText);

    assert.strictEqual(result.energy.per100g, 2292);
    assert.strictEqual(result.fat.per100g, 33);
    assert.strictEqual(result.carbohydrates.per100g, 55);
    assert.strictEqual(result.sugars.per100g, 45);
    assert.strictEqual(result.protein.per100g, 6.8);
    assert.strictEqual(result.salt.per100g, 0.18);
  });

  test("AC-3: Handles comma decimals", () => {
    const ocrText = `
      Per 100g
      Energy 2292 kJ / 545 kcal
      Fat 33,5 g
      Carbohydrate 55,2 g
      Protein 6,8 g
    `;

    const result = parseNutritionTable(ocrText);

    assert.strictEqual(result.fat.per100g, 33.5);
    assert.strictEqual(result.carbohydrates.per100g, 55.2);
    assert.strictEqual(result.protein.per100g, 6.8);
  });

  test("AC-4: Handles empty/invalid OCR text", () => {
    const result1 = parseNutritionTable("");
    assert.deepStrictEqual(result1, {});

    const result2 = parseNutritionTable(null);
    assert.deepStrictEqual(result2, {});

    const result3 = parseNutritionTable("   ");
    assert.deepStrictEqual(result3, {});
  });
});

describe("UI Integration - View Nutrition", () => {
  test("AC-5: Scales nutrition for a serving size", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      saturatedFat: 13,
      carbohydrates: 55,
      sugars: 45,
      fiber: 2.4,
      protein: 6.8,
      salt: 0.18,
    };

    // 100g serving
    const result = scaleNutrition(per100g, 100);

    assert.strictEqual(result.energy, 2292);
    assert.strictEqual(result.fat, 33);
    assert.strictEqual(result.protein, 6.8);
  });

  test("AC-6: Scales nutrition for a partial serving", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      carbohydrates: 55,
      protein: 6.8,
    };

    // 50g serving
    const result = scaleNutrition(per100g, 50);

    assert.strictEqual(result.energy, 1146);
    assert.strictEqual(result.fat, 16.5);
    assert.strictEqual(result.carbohydrates, 27.5);
    assert.strictEqual(result.protein, 3.4);
  });
});

describe("UI Integration - Create Meal", () => {
  test("AC-7: Creates a meal with foods from OCR", () => {
    const ocrText = `
      Per 100g
      Energy 2292 kJ / 545 kcal
      Fat 33 g
      Carbohydrate 55 g
      Protein 6.8 g
    `;

    const parsed = parseNutritionTable(ocrText);

    // Create a food entry from parsed data
    const food = {
      id: "food-ocr-1",
      name: "Parsed Food",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: parsed.energy.per100g,
        fat: parsed.fat.per100g,
        carbohydrates: parsed.carbohydrates.per100g,
        protein: parsed.protein.per100g,
      },
    };

    // Create a meal with this food
    const meal = createMeal("Lunch", [
      { foodId: "food-ocr-1", grams: 150 },
    ]);

    assert.ok(meal.id);
    assert.strictEqual(meal.name, "Lunch");
    assert.strictEqual(meal.items.length, 1);
    assert.strictEqual(meal.items[0].grams, 150);
  });

  test("AC-8: Calculates meal nutrition from multiple foods", () => {
    const foodDb = {
      "food-1": {
        id: "food-1",
        name: "Apple",
        energy: 52,
        fat: 0.2,
        saturatedFat: 0,
        carbohydrates: 13.8,
        sugars: 10.4,
        fiber: 2.4,
        protein: 0.3,
        salt: 0,
        servingSize: 100,
      },
      "food-2": {
        id: "food-2",
        name: "Yogurt",
        energy: 61,
        fat: 1.0,
        saturatedFat: 0.6,
        carbohydrates: 3.6,
        sugars: 3.2,
        fiber: 0,
        protein: 5.3,
        salt: 0.1,
        servingSize: 100,
      },
    };

    const meal = createMeal("Breakfast", [
      { foodId: "food-1", grams: 200 },
      { foodId: "food-2", grams: 150 },
    ]);

    const total = getMealTotal(meal, foodDb);

    // Apple 200g: energy 104, fat 0.4, carbs 27.6, sugars 20.8, fiber 4.8, protein 0.6
    // Yogurt 150g: energy 91.5, fat 1.5, satFat 0.9, carbs 5.4, sugars 4.8, fiber 0, protein 7.95, salt 0.15
    assert.strictEqual(total.energy, 195.5);
    assert.strictEqual(total.fat, 1.9);
    assert.strictEqual(total.saturatedFat, 0.9);
    assert.strictEqual(total.carbohydrates, 33);
    assert.strictEqual(total.sugars, 25.6);
    assert.strictEqual(total.fiber, 4.8);
    assert.strictEqual(total.protein, 8.55);
    assert.strictEqual(total.salt, 0.15);
  });
});

describe("UI Integration - Track Nutrients", () => {
  test("AC-9: Stores and retrieves food via Storage", () => {
    const storage = new Storage({
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
    });

    const food = {
      id: "food-1",
      name: "Banana",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: 89,
        fat: 0.3,
        carbohydrates: 22.8,
        protein: 1.1,
      },
    };

    storage.addFood(food);
    const retrieved = storage.getFood("food-1");

    assert.ok(retrieved);
    assert.strictEqual(retrieved.name, "Banana");
    assert.strictEqual(retrieved.nutrition.energy, 89);
  });

  test("AC-10: Stores and retrieves meals via Storage", () => {
    const storage = new Storage({
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
    });

    const meal = {
      id: "meal-1",
      name: "Lunch",
      items: [
        { foodId: "food-1", grams: 200 },
      ],
      createdAt: new Date().toISOString(),
    };

    storage.addMeal(meal);
    const retrieved = storage.getMeal("meal-1");

    assert.ok(retrieved);
    assert.strictEqual(retrieved.name, "Lunch");
    assert.strictEqual(retrieved.items.length, 1);
  });

  test("AC-11: Lists all stored foods", () => {
    const storage = new Storage({
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
    });

    storage.addFood({ id: "food-1", name: "Apple" });
    storage.addFood({ id: "food-2", name: "Banana" });

    const foods = storage.listFoods();

    assert.strictEqual(foods.length, 2);
    assert.strictEqual(foods[0].name, "Apple");
    assert.strictEqual(foods[1].name, "Banana");
  });

  test("AC-12: Updates a food entry", () => {
    const storage = new Storage({
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
    });

    storage.addFood({ id: "food-1", name: "Apple", nutrition: { energy: 52 } });
    storage.updateFood({ id: "food-1", name: "Apple", nutrition: { energy: 53 } });

    const updated = storage.getFood("food-1");
    assert.strictEqual(updated.nutrition.energy, 53);
  });

  test("AC-13: Deletes a food entry", () => {
    const storage = new Storage({
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
    });

    storage.addFood({ id: "food-1", name: "Apple" });
    storage.deleteFood("food-1");

    const deleted = storage.getFood("food-1");
    assert.strictEqual(deleted, undefined);
  });

  test("AC-14: End-to-end: OCR -> Scale -> Meal -> Storage", () => {
    // Step 1: Parse OCR text
    const ocrText = `
      Per 100g
      Energy 2292 kJ / 545 kcal
      Fat 33 g
      Carbohydrate 55 g
      Protein 6.8 g
    `;
    const parsed = parseNutritionTable(ocrText);

    // Step 2: Create food from parsed data
    const food = {
      id: "food-ocr-1",
      name: "Chocolate Bar",
      servingSize: 100,
      servingUnit: "g",
      nutrition: {
        energy: parsed.energy.per100g,
        fat: parsed.fat.per100g,
        carbohydrates: parsed.carbohydrates.per100g,
        protein: parsed.protein.per100g,
      },
    };

    // Step 3: Store food
    const storage = new Storage({
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
    });
    storage.addFood(food);

    // Step 4: Create meal with the food
    const meal = createMeal("Snack", [
      { foodId: "food-ocr-1", grams: 50 },
    ]);

    // Step 5: Calculate meal total
    const foodDb = { "food-ocr-1": food };
    const total = getMealTotal(meal, foodDb);

    // Step 6: Store meal
    storage.addMeal(meal);

    // Verify end-to-end
    assert.strictEqual(total.energy, 1146);
    assert.strictEqual(total.fat, 16.5);
    assert.strictEqual(total.carbohydrates, 27.5);
    assert.strictEqual(total.protein, 3.4);

    const storedMeal = storage.getMeal(meal.id);
    assert.ok(storedMeal);
    assert.strictEqual(storedMeal.name, "Snack");
  });
});