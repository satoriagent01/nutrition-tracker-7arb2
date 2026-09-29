import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { scaleNutrition, calculatePerGram, aggregateNutrition } from "../src/nutrition-scaling.js";

describe("Nutrition Scaling - scaleNutrition", () => {
  test("AC-1: Scales nutrition values proportionally by weight", () => {
    const baseNutrition = {
      energy: { kJ: 428, kcal: 101 },
      protein: 8.2,
      carbohydrate: 12.3,
      fat: 3.5,
    };

    const result = scaleNutrition(baseNutrition, 200, 100);

    assert.strictEqual(result.energy.kJ, 856);
    assert.strictEqual(result.energy.kcal, 202);
    assert.strictEqual(result.protein, 16.4);
    assert.strictEqual(result.carbohydrate, 24.6);
    assert.strictEqual(result.fat, 7.0);
  });

  test("AC-2: Scales down when target weight is less than base", () => {
    const baseNutrition = {
      energy: { kJ: 428, kcal: 101 },
      protein: 8.2,
      carbohydrate: 12.3,
      fat: 3.5,
    };

    const result = scaleNutrition(baseNutrition, 50, 100);

    assert.strictEqual(result.energy.kJ, 214);
    assert.strictEqual(result.energy.kcal, 50.5);
    assert.strictEqual(result.protein, 4.1);
    assert.strictEqual(result.carbohydrate, 6.15);
    assert.strictEqual(result.fat, 1.75);
  });

  test("AC-3: Handles 1:1 scaling (no change)", () => {
    const baseNutrition = {
      energy: { kJ: 428, kcal: 101 },
      protein: 8.2,
      carbohydrate: 12.3,
      fat: 3.5,
    };

    const result = scaleNutrition(baseNutrition, 100, 100);

    assert.strictEqual(result.energy.kJ, 428);
    assert.strictEqual(result.energy.kcal, 101);
    assert.strictEqual(result.protein, 8.2);
    assert.strictEqual(result.carbohydrate, 12.3);
    assert.strictEqual(result.fat, 3.5);
  });

  test("AC-4: Handles missing energy values gracefully", () => {
    const baseNutrition = {
      protein: 5.0,
      carbohydrate: 10.0,
    };

    const result = scaleNutrition(baseNutrition, 200, 100);

    assert.strictEqual(result.energy, undefined);
    assert.strictEqual(result.protein, 10.0);
    assert.strictEqual(result.carbohydrate, 20.0);
  });

  test("AC-5: Handles sub-nutrients (sugars, fiber)", () => {
    const baseNutrition = {
      energy: { kcal: 200 },
      carbohydrate: 25,
      sugars: 15,
      fiber: 3,
      fat: 5,
    };

    const result = scaleNutrition(baseNutrition, 50, 100);

    assert.strictEqual(result.energy.kcal, 100);
    assert.strictEqual(result.carbohydrate, 12.5);
    assert.strictEqual(result.sugars, 7.5);
    assert.strictEqual(result.fiber, 1.5);
    assert.strictEqual(result.fat, 2.5);
  });
});

describe("Nutrition Scaling - calculatePerGram", () => {
  test("AC-6: Calculates per-gram values from per-100g", () => {
    const per100g = {
      energy: { kJ: 428, kcal: 101 },
      protein: 8.2,
      carbohydrate: 12.3,
      fat: 3.5,
    };

    const result = calculatePerGram(per100g);

    assert.strictEqual(result.energy.kJ, 4.28);
    assert.strictEqual(result.energy.kcal, 1.01);
    assert.strictEqual(result.protein, 0.082);
    assert.strictEqual(result.carbohydrate, 0.123);
    assert.strictEqual(result.fat, 0.035);
  });

  test("AC-7: Handles missing energy values", () => {
    const per100g = {
      protein: 8.2,
      carbohydrate: 12.3,
    };

    const result = calculatePerGram(per100g);

    assert.strictEqual(result.energy, undefined);
    assert.strictEqual(result.protein, 0.082);
    assert.strictEqual(result.carbohydrate, 0.123);
  });
});

describe("Nutrition Scaling - aggregateNutrition", () => {
  test("AC-8: Aggregates nutrition from multiple foods", () => {
    const foods = [
      {
        name: "Apple",
        weight: 150,
        nutrition: {
          energy: { kcal: 78 },
          carbohydrate: 20.6,
          sugar: 10.4,
          fiber: 2.4,
        },
      },
      {
        name: "Banana",
        weight: 120,
        nutrition: {
          energy: { kcal: 107 },
          carbohydrate: 27.4,
          sugar: 12.2,
          fiber: 2.6,
        },
      },
    ];

    const result = aggregateNutrition(foods);

    assert.strictEqual(result.energy.kcal, 185);
    assert.strictEqual(result.carbohydrate, 48.0);
    assert.strictEqual(result.sugar, 22.6);
    assert.strictEqual(result.fiber, 5.0);
  });

  test("AC-9: Aggregates with kJ and kcal", () => {
    const foods = [
      {
        name: "Food A",
        weight: 100,
        nutrition: {
          energy: { kJ: 428, kcal: 101 },
          protein: 8.2,
        },
      },
      {
        name: "Food B",
        weight: 200,
        nutrition: {
          energy: { kJ: 200, kcal: 50 },
          protein: 5.0,
        },
      },
    ];

    const result = aggregateNutrition(foods);

    assert.strictEqual(result.energy.kJ, 628);
    assert.strictEqual(result.energy.kcal, 151);
    assert.strictEqual(result.protein, 13.2);
  });

  test("AC-10: Handles empty food list", () => {
    const result = aggregateNutrition([]);

    assert.deepStrictEqual(result, {});
  });

  test("AC-11: Handles foods with partial nutrition data", () => {
    const foods = [
      {
        name: "Food A",
        weight: 100,
        nutrition: { protein: 5.0 },
      },
      {
        name: "Food B",
        weight: 100,
        nutrition: { carbohydrate: 10.0 },
      },
    ];

    const result = aggregateNutrition(foods);

    assert.strictEqual(result.protein, 5.0);
    assert.strictEqual(result.carbohydrate, 10.0);
  });
});