import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseNutritionTable } from "../src/ocr.js";

describe("parseNutritionTable", () => {
  test("parses a standard nutrition table with per 100g and per serving columns", () => {
    const text = `Nährwertdeklaration / Déclaration nutritionnelle
Energie / énergie / energie / energia  2292 kJ  688 kJ
Fett / matières grasses / vetten / grassi  33 g  10 g
davon gesättigte Fettsäuren / dont acides gras saturés / waarvan verzadigde vetzuren / di cui acidi grassi saturi  13 g  3,9 g
Kohlenhydrate / glucides / koolhydraten / carboidrati  55 g  16 g
davon Zucker / dont sucres / waarvan suikers / di cui zuccheri  45 g  14 g
Ballaststoffe / fibres alimentaires / vezels / fibre  2,4 g  0,7 g
Eiweiß / protéines / eiwitten / proteïne  6,8 g  2,0 g
Salz / sel / zout / sale  0,18 g  0,05 g`;

    const result = parseNutritionTable(text);

    assert.deepStrictEqual(result, {
      energy: { per100g: 2292, perServing: 688, unit: "kJ" },
      fat: { per100g: 33, perServing: 10, unit: "g" },
      saturatedFat: { per100g: 13, perServing: 3.9, unit: "g" },
      carbohydrates: { per100g: 55, perServing: 16, unit: "g" },
      sugars: { per100g: 45, perServing: 14, unit: "g" },
      fiber: { per100g: 2.4, perServing: 0.7, unit: "g" },
      protein: { per100g: 6.8, perServing: 2.0, unit: "g" },
      salt: { per100g: 0.18, perServing: 0.05, unit: "g" },
    });
  });

  test("parses a simple nutrition table with only per 100g", () => {
    const text = `Voedingswaarde per 100 ml
energie  199 kJ / 47 kcal
vetten, waarvan  0 g
- verzadigde vetzuren  0 g
- onverzadigde vetzuren  0 g
koolhydraten, waarvan  11 g
- suikers  10 g
- vezels  0,7 g
eiwitten  0,4 g
zout  0 g`;

    const result = parseNutritionTable(text);

    assert.strictEqual(result.energy.per100g, 199);
    assert.strictEqual(result.energy.perServing, null);
    assert.strictEqual(result.fat.per100g, 0);
    assert.strictEqual(result.saturatedFat.per100g, 0);
    assert.strictEqual(result.carbohydrates.per100g, 11);
    assert.strictEqual(result.sugars.per100g, 10);
    assert.strictEqual(result.fiber.per100g, 0.7);
    assert.strictEqual(result.protein.per100g, 0.4);
    assert.strictEqual(result.salt.per100g, 0);
  });

  test("parses a table with per serving only (no per 100g)", () => {
    const text = `Per glas (200 ml)
ENERGIE  399 kJ / 94 kcal
VETTEN  0 g
VERZ. VET  0 g
KOOLHYDRATEN  22 g
SUIKERS  20 g
ZOUT  0 g`;

    const result = parseNutritionTable(text);

    assert.strictEqual(result.energy.per100g, null);
    assert.strictEqual(result.energy.perServing, 399);
    assert.strictEqual(result.fat.perServing, 0);
    assert.strictEqual(result.saturatedFat.perServing, 0);
    assert.strictEqual(result.carbohydrates.perServing, 22);
    assert.strictEqual(result.sugars.perServing, 20);
    assert.strictEqual(result.salt.perServing, 0);
  });

  test("handles missing values gracefully", () => {
    const text = `Energie  2292 kJ
Fett  33 g
Kohlenhydrate  55 g`;

    const result = parseNutritionTable(text);

    assert.strictEqual(result.energy.per100g, 2292);
    assert.strictEqual(result.fat.per100g, 33);
    assert.strictEqual(result.carbohydrates.per100g, 55);
    assert.strictEqual(result.saturatedFat.per100g, null);
    assert.strictEqual(result.sugars.per100g, null);
    assert.strictEqual(result.fiber.per100g, null);
    assert.strictEqual(result.protein.per100g, null);
    assert.strictEqual(result.salt.per100g, null);
  });

  test("handles comma decimals correctly", () => {
    const text = `Energie  2292 kJ
Fett  33,5 g
davon gesättigte Fettsäuren  13,2 g
Kohlenhydrate  55,8 g
davon Zucker  45,3 g
Ballaststoffe  2,4 g
Eiweiß  6,8 g
Salz  0,18 g`;

    const result = parseNutritionTable(text);

    assert.strictEqual(result.fat.per100g, 33.5);
    assert.strictEqual(result.saturatedFat.per100g, 13.2);
    assert.strictEqual(result.carbohydrates.per100g, 55.8);
    assert.strictEqual(result.sugars.per100g, 45.3);
  });

  test("handles kcal in energy value", () => {
    const text = `Energie  549 kcal
Fett  33 g
Kohlenhydrate  55 g
davon Zucker  45 g
Eiweiß  6,8 g
Salz  0,18 g`;

    const result = parseNutritionTable(text);

    assert.strictEqual(result.energy.per100g, 549);
  });

  test("returns empty object for unrecognized text", () => {
    const text = "This is just random text with no nutrition data";
    const result = parseNutritionTable(text);

    assert.deepStrictEqual(result, {});
  });

  test("handles both kJ and kcal in energy", () => {
    const text = `Energie  2292 kJ / 549 kcal
Fett  33 g
Kohlenhydrate  55 g
davon Zucker  45 g
Eiweiß  6,8 g
Salz  0,18 g`;

    const result = parseNutritionTable(text);

    assert.strictEqual(result.energy.per100g, 2292);
  });
});