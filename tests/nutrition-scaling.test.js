import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { scaleNutrition, calculatePerGram, aggregateNutrition } from "../src/nutrition.js";

describe("Nutrition Scaling - scaleNutrition", () => {
  test("AC-1: Scales nutrition values proportionally by weight", () => {
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

    const result = scaleNutrition(per100g, 200);

    assert.strictEqual(result.energy, 4584);
    assert.strictEqual(result.fat, 66);
    assert.strictEqual(result.saturatedFat, 26);
    assert.strictEqual(result.carbohydrates, 110);
    assert.strictEqual(result.sugars, 90);
    assert.strictEqual(result.fiber, 4.8);
    assert.strictEqual(result.protein, 13.6);
    assert.strictEqual(result.salt, 0.36);
  });

  test("AC-2: Scales down when target weight is less than 100g", () => {
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

    const result = scaleNutrition(per100g, 50);

    assert.strictEqual(result.energy, 1146);
    assert.strictEqual(result.fat, 16.5);
    assert.strictEqual(result.saturatedFat, 6.5);
    assert.strictEqual(result.carbohydrates, 27.5);
    assert.strictEqual(result.sugars, 22.5);
    assert.strictEqual(result.fiber, 1.2);
    assert.strictEqual(result.protein, 3.4);
    assert.strictEqual(result.salt, 0.09);
  });

  test("AC-3: Handles 1:1 scaling (no change)", () => {
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

    const result = scaleNutrition(per100g, 100);

    assert.strictEqual(result.energy, 2292);
    assert.strictEqual(result.fat, 33);
    assert.strictEqual(result.saturatedFat, 13);
    assert.strictEqual(result.carbohydrates, 55);
    assert.strictEqual(result.sugars, 45);
    assert.strictEqual(result.fiber, 2.4);
    assert.strictEqual(result.protein, 6.8);
    assert.strictEqual(result.salt, 0.18);
  });

  test("AC-4: Handles missing energy values gracefully", () => {
    const per100g = {
      protein: 5.0,
      carbohydrates: 10.0,
    };

    const result = scaleNutrition(per100g, 200);

    assert.strictEqual(result.energy, undefined);
    assert.strictEqual(result.protein, 10);
    assert.strictEqual(result.carbohydrates, 20);
  });

  test("AC-5: Handles zero grams", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      carbohydrates: 55,
      protein: 6.8,
    };

    const result = scaleNutrition(per100g, 0);

    assert.strictEqual(result.energy, 0);
    assert.strictEqual(result.fat, 0);
    assert.strictEqual(result.carbohydrates, 0);
    assert.strictEqual(result.protein, 0);
  });

  test("AC-6: Handles large gram amounts", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      carbohydrates: 55,
      protein: 6.8,
    };

    const result = scaleNutrition(per100g, 500);

    assert.strictEqual(result.energy, 11460);
    assert.strictEqual(result.fat, 165);
    assert.strictEqual(result.carbohydrates, 275);
    assert.strictEqual(result.protein, 34);
  });
});

describe("Nutrition Scaling - calculatePerGram", () => {
  test("AC-7: Calculates per-gram values from per-100g", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      carbohydrates: 55,
      protein: 6.8,
    };

    const result = calculatePerGram(per100g);

    assert.strictEqual(result.energy, 22.92);
    assert.strictEqual(result.fat, 0.33);
    assert.strictEqual(result.carbohydrates, 0.55);
    assert.strictEqual(result.protein, 0.068);
  });

  test("AC-8: Per-gram * 100 returns original per-100g", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      carbohydrates: 55,
      protein: 6.8,
    };

    const perGram = calculatePerGram(per100g);
    const backTo100 = scaleNutrition(perGram, 100);

    assert.strictEqual(backTo100.energy, 2292);
    assert.strictEqual(backTo100.fat, 33);
    assert.strictEqual(backTo100.carbohydrates, 55);
    assert.strictEqual(backTo100.protein, 6.8);
  });
});

describe("Nutrition Scaling - aggregateNutrition", () => {
  test("AC-9: Aggregates nutrition from multiple sources", () => {
    const sources = [
      { energy: 229.2, fat: 3.3, carbohydrates: 5.5, protein: 0.68 },
      { energy: 199, fat: 0, carbohydrates: 11, protein: 0.4 },
    ];

    const result = aggregateNutrition(sources);

    assert.strictEqual(result.energy, 428.2);
    assert.strictEqual(result.fat, 3.3);
    assert.strictEqual(result.carbohydrates, 16.5);
    assert.strictEqual(result.protein, 1.08);
  });

  test("AC-10: Handles empty array", () => {
    const result = aggregateNutrition([]);

    assert.deepStrictEqual(result, {});
  });

  test("AC-11: Handles sources with different keys", () => {
    const sources = [
      { energy: 100, fat: 5 },
      { energy: 200, protein: 10 },
    ];

    const result = aggregateNutrition(sources);

    assert.strictEqual(result.energy, 300);
    assert.strictEqual(result.fat, 5);
    assert.strictEqual(result.protein, 10);
  });

  test("AC-12: Handles missing values in sources", () => {
    const sources = [
      { energy: 100, fat: 5 },
      { energy: 200 },
    ];

    const result = aggregateNutrition(sources);

    assert.strictEqual(result.energy, 300);
    assert.strictEqual(result.fat, 5);
  });
});