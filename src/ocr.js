/**
 * OCR module - parses nutrition table text into structured data.
 * In production, this would call an OpenAI-compatible endpoint.
 * For now, it provides the parseNutritionTable function that
 * extracts nutrition data from OCR text output.
 */

/**
 * Parses OCR text output into structured nutrition data.
 * @param {string} text - The OCR-extracted text from a nutrition label
 * @returns {object} Parsed nutrition data with per100g and perServing values
 */
export function parseNutritionTable(text) {
  if (!text || typeof text !== "string") {
    return {};
  }

  const result = {
    energy: { per100g: null, perServing: null, unit: "kJ" },
    fat: { per100g: null, perServing: null, unit: "g" },
    saturatedFat: { per100g: null, perServing: null, unit: "g" },
    carbohydrates: { per100g: null, perServing: null, unit: "g" },
    sugars: { per100g: null, perServing: null, unit: "g" },
    fiber: { per100g: null, perServing: null, unit: "g" },
    protein: { per100g: null, perServing: null, unit: "g" },
    salt: { per100g: null, perServing: null, unit: "g" },
  };

  const lines = text.split("\n");
  let hasPer100g = false;
  let hasPerServing = false;

  // Detect column headers
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("100") || lower.includes("per 100")) {
      hasPer100g = true;
    }
    if (lower.includes("serving") || lower.includes("per ") || lower.includes("glas") || lower.includes("porción") || lower.includes("porzione")) {
      hasPerServing = true;
    }
  }

  // Nutrient mapping: regex patterns to match various language names
  const nutrientPatterns = [
    { key: "energy", patterns: [/energie/i, /energy/i, /calorías?/i, /calorias?/i, /calorías?/i] },
    { key: "fat", patterns: [/fett/i, /fat/i, /gras/i, /grasa/i, /grassi/i, /vet/i, /matières grasses/i, /materia grass/i] },
    { key: "saturatedFat", patterns: [/gesättigte/i, /saturated/i, /saturés/i, /saturate/i, /saturi/i, /verzadigde/i, /verzadigde vet/i, /verzadigde vetzuren/i, /verzadigde vet/i, /verzadigde/i, /verz. vet/i, /verz. vet/i, /acides gras saturés/i, /acidi grassi saturi/i, /acidi grassi saturi/i] },
    { key: "carbohydrates", patterns: [/kohlenhydrate/i, /carbohydrates/i, /glucides/i, /koolhydraten/i, /carboidrati/i, /carbohidratos/i, /carbohydrates/i, /koolhydraten/i, /koolhydraten/i, /koolhydraten/i] },
    { key: "sugars", patterns: [/zucker/i, /sugar/i, /sucres/i, /suikers/i, /zuccheri/i, /azúcar/i, /azucre/i, /sucre/i, /suiikers/i, /suiikers/i, /suiikers/i] },
    { key: "fiber", patterns: [/ballaststoffe/i, /fiber/i, /fibres/i, /vezels/i, /fibre/i, /fibre/i, /fibra/i, /fibras/i] },
    { key: "protein", patterns: [/eiweiß/i, /protein/i, /protéines/i, /eiwitten/i, /proteïne/i, /proteína/i, /proteine/i, /proteins/i, /proteine/i] },
    { key: "salt", patterns: [/salz/i, /salt/i, /sel/i, /zout/i, /sale/i, /sal/i, /sodio/i, /sodium/i] },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    for (const { key, patterns } of nutrientPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) {
          // Extract the numeric value(s) from the line
          // Look for patterns like "2292 kJ", "33 g", "2292 kJ / 549 kcal"
          const valueMatch = trimmed.match(/([\d,]+)\s*(?:kJ|kcal|g|ml)/);
          if (valueMatch) {
            const value = parseFloat(valueMatch[1].replace(",", "."));
            if (key === "energy") {
              // Energy might have both kJ and kcal
              const kJMatch = trimmed.match(/([\d,]+)\s*kJ/);
              const kcalMatch = trimmed.match(/([\d,]+)\s*kcal/);
              if (kJMatch) {
                const kJVal = parseFloat(kJMatch[1].replace(",", "."));
                if (hasPer100g && !hasPerServing) {
                  result.energy.per100g = kJVal;
                } else if (hasPer100g && hasPerServing) {
                  // Try to determine which column is which
                  // If there are two values, first is per 100g, second is per serving
                  const allNums = trimmed.match(/([\d,]+)/g);
                  if (allNums && allNums.length >= 2) {
                    result.energy.per100g = parseFloat(allNums[0].replace(",", "."));
                    result.energy.perServing = parseFloat(allNums[1].replace(",", "."));
                  } else {
                    result.energy.per100g = kJVal;
                  }
                } else {
                  result.energy.perServing = kJVal;
                }
              } else if (kcalMatch) {
                const kcalVal = parseFloat(kcalMatch[1].replace(",", "."));
                if (hasPer100g && !hasPerServing) {
                  result.energy.per100g = kcalVal;
                } else if (hasPer100g && hasPerServing) {
                  const allNums = trimmed.match(/([\d,]+)/g);
                  if (allNums && allNums.length >= 2) {
                    result.energy.per100g = parseFloat(allNums[0].replace(",", "."));
                    result.energy.perServing = parseFloat(allNums[1].replace(",", "."));
                  } else {
                    result.energy.per100g = kcalVal;
                  }
                } else {
                  result.energy.perServing = kcalVal;
                }
              }
            } else {
              if (hasPer100g && !hasPerServing) {
                result[key].per100g = value;
              } else if (hasPer100g && hasPerServing) {
                // Try to find two values
                const allNums = trimmed.match(/([\d,]+)/g);
                if (allNums && allNums.length >= 2) {
                  result[key].per100g = parseFloat(allNums[0].replace(",", "."));
                  result[key].perServing = parseFloat(allNums[1].replace(",", "."));
                } else {
                  result[key].per100g = value;
                }
              } else {
                result[key].perServing = value;
              }
            }
          }
          break;
        }
      }
    }
  }

  // If no per100g or perServing was detected, default to per100g
  if (!hasPer100g && !hasPerServing) {
    for (const key of Object.keys(result)) {
      if (result[key].perServing !== null) {
        result[key].per100g = result[key].perServing;
        result[key].perServing = null;
      }
    }
  }

  // Check if we found any data at all
  const hasAnyData = Object.values(result).some(
    (v) => v.per100g !== null || v.perServing !== null
  );

  if (!hasAnyData) {
    return {};
  }

  return result;
}