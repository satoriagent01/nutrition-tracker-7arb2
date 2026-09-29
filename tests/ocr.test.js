import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseNutritionText } from "../src/ocr.js";

describe("OCR Parser - parseNutritionText", () => {
  test("AC-1: Parses standard EU nutrition label with per-serving values", () => {
    const text = `Energy 428 kJ / 101 kcal
Protein 8.2 g
Carbohydrate 12.3 g
Fat 3.5 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.servingSize, 100);
    assert.strictEqual(result.servingUnit, "g");
    assert.strictEqual(result.nutrients.energy.kJ, 428);
    assert.strictEqual(result.nutrients.energy.kcal, 101);
    assert.strictEqual(result.nutrients.protein, 8.2);
    assert.strictEqual(result.nutrients.carbohydrate, 12.3);
    assert.strictEqual(result.nutrients.fat, 3.5);
  });

  test("AC-2: Handles comma decimals (e.g., 33,3 g → 33.3)", () => {
    const text = `Energy 1 390 kJ / 330 kcal
Protein 12,5 g
Carbohydrate 45,0 g
Fat 8,3 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.nutrients.energy.kJ, 1390);
    assert.strictEqual(result.nutrients.energy.kcal, 330);
    assert.strictEqual(result.nutrients.protein, 12.5);
    assert.strictEqual(result.nutrients.carbohydrate, 45.0);
    assert.strictEqual(result.nutrients.fat, 8.3);
  });

  test("AC-3: Handles both kJ and kcal in energy rows", () => {
    const text = `Energy 850 kJ / 200 kcal
Protein 5.0 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.nutrients.energy.kJ, 850);
    assert.strictEqual(result.nutrients.energy.kcal, 200);
    assert.strictEqual(result.nutrients.protein, 5.0);
  });

  test("AC-4: Handles multi-language nutrient names (German)", () => {
    const text = `Energie 428 kJ / 101 kcal
Eiweiß 8.2 g
Kohlenhydrate 12.3 g
Fett 3.5 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.nutrients.energy.kJ, 428);
    assert.strictEqual(result.nutrients.energy.kcal, 101);
    assert.strictEqual(result.nutrients.protein, 8.2);
    assert.strictEqual(result.nutrients.carbohydrate, 12.3);
    assert.strictEqual(result.nutrients.fat, 3.5);
  });

  test("AC-5: Handles per-100g only format", () => {
    const text = `Per 100g
Energy 200 kcal
Protein 10 g
Carbohydrate 25 g
Fat 5 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.servingSize, 100);
    assert.strictEqual(result.nutrients.energy.kcal, 200);
    assert.strictEqual(result.nutrients.protein, 10);
    assert.strictEqual(result.nutrients.carbohydrate, 25);
    assert.strictEqual(result.nutrients.fat, 5);
  });

  test("AC-6: Handles per-serving only format with serving size detection", () => {
    const text = `Per serving (250g)
Energy 500 kcal
Protein 20 g
Carbohydrate 60 g
Fat 10 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.servingSize, 250);
    assert.strictEqual(result.nutrients.energy.kcal, 500);
    assert.strictEqual(result.nutrients.protein, 20);
    assert.strictEqual(result.nutrients.carbohydrate, 60);
    assert.strictEqual(result.nutrients.fat, 10);
  });

  test("AC-7: Handles both per-100g and per-serving formats", () => {
    const text = `Per 100g          Per serving (200g)
Energy 200 kcal   400 kcal
Protein 10 g      20 g
Carbohydrate 25 g 50 g
Fat 5 g           10 g`;

    const result = parseNutritionText(text);

    // Should use per-serving values when both are present
    assert.strictEqual(result.servingSize, 200);
    assert.strictEqual(result.nutrients.energy.kcal, 400);
    assert.strictEqual(result.nutrients.protein, 20);
    assert.strictEqual(result.nutrients.carbohydrate, 50);
    assert.strictEqual(result.nutrients.fat, 10);
  });

  test("AC-8: Handles missing energy values gracefully", () => {
    const text = `Protein 5 g
Carbohydrate 10 g
Fat 2 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.nutrients.energy.kJ, undefined);
    assert.strictEqual(result.nutrients.energy.kcal, undefined);
    assert.strictEqual(result.nutrients.protein, 5);
    assert.strictEqual(result.nutrients.carbohydrate, 10);
    assert.strictEqual(result.nutrients.fat, 2);
  });

  test("AC-9: Handles empty or minimal input", () => {
    const result = parseNutritionText("");

    assert.deepStrictEqual(result.nutrients, {});
    assert.strictEqual(result.servingSize, 100);
  });

  test("AC-10: Handles fiber and sugar sub-nutrients", () => {
    const text = `Energy 200 kcal
Protein 10 g
Carbohydrate 25 g
  of which sugars 15 g
  of which fiber 3 g
Fat 5 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.nutrients.energy.kcal, 200);
    assert.strictEqual(result.nutrients.protein, 10);
    assert.strictEqual(result.nutrients.carbohydrate, 25);
    assert.strictEqual(result.nutrients.sugars, 15);
    assert.strictEqual(result.nutrients.fiber, 3);
    assert.strictEqual(result.nutrients.fat, 5);
  });

  test("AC-11: Handles salt and sodium", () => {
    const text = `Energy 200 kcal
Protein 10 g
Salt 1.5 g
Sodium 0.6 g`;

    const result = parseNutritionText(text);

    assert.strictEqual(result.nutrients.salt, 1.5);
    assert.strictEqual(result.nutrients.sodium, 0.6);
  });

  test("AC-12: Handles malformed input without crashing", () => {
    const text = `This is not a nutrition label
random text here
no numbers at all`;

    const result = parseNutritionText(text);

    assert.deepStrictEqual(result.nutrients, {});
    assert.strictEqual(result.servingSize, 100);
  });
});