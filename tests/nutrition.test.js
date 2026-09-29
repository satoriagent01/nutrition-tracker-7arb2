import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { scaleNutrition } from "../src/nutrition.js";

describe("scaleNutrition", () => {
  test("scales nutrition values by grams correctly", () => {
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

    const result = scaleNutrition(per100g, 30);

    assert.strictEqual(result.energy, 687.6);
    assert.strictEqual(result.fat, 9.9);
    assert.strictEqual(result.saturatedFat, 3.9);
    assert.strictEqual(result.carbohydrates, 16.5);
    assert.strictEqual(result.sugars, 13.5);
    assert.strictEqual(result.fiber, 0.72);
    assert.strictEqual(result.protein, 2.04);
    assert.strictEqual(result.salt, 0.054);
  });

  test("scales by 100g returns same values", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      carbohydrates: 55,
      protein: 6.8,
    };

    const result = scaleNutrition(per100g, 100);

    assert.strictEqual(result.energy, 2292);
    assert.strictEqual(result.fat, 33);
    assert.strictEqual(result.carbohydrates, 55);
    assert.strictEqual(result.protein, 6.8);
  });

  test("scales by 0g returns all zeros", () => {
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

  test("handles fractional grams", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      carbohydrates: 55,
      protein: 6.8,
    };

    const result = scaleNutrition(per100g, 50);

    assert.strictEqual(result.energy, 1146);
    assert.strictEqual(result.fat, 16.5);
    assert.strictEqual(result.carbohydrates, 27.5);
    assert.strictEqual(result.protein, 3.4);
  });

  test("handles missing fields gracefully", () => {
    const per100g = {
      energy: 2292,
      carbohydrates: 55,
    };

    const result = scaleNutrition(per100g, 30);

    assert.strictEqual(result.energy, 687.6);
    assert.strictEqual(result.carbohydrates, 16.5);
    assert.strictEqual(result.fat, undefined);
  });

  test("handles large gram amounts", () => {
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

  test("handles small gram amounts", () => {
    const per100g = {
      energy: 2292,
      fat: 33,
      carbohydrates: 55,
      protein: 6.8,
    };

    const result = scaleNutrition(per100g, 10);

    assert.strictEqual(result.energy, 229.2);
    assert.strictEqual(result.fat, 3.3);
    assert.strictEqual(result.carbohydrates, 5.5);
    assert.strictEqual(result.protein, 0.68);
  });
});