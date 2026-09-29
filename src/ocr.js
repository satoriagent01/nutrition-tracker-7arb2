/**
 * OCR extraction module - parses nutrition label text into structured data.
 */

/**
 * Maps multi-language nutrient names to standard keys.
 * @param {string} name - The nutrient name (any language)
 * @returns {string|null} - Standard key or null if unrecognized
 */
function mapNutrientName(name) {
  const lower = name.toLowerCase().trim();

  // Energy
  if (/^(energie|énergie|energia|energy)\b/.test(lower)) return "energy";

  // Fat
  if (/^(fett|matières grasses|vetten|grassi|fat|vet)\b/.test(lower)) return "fat";

  // Saturated fat
  if (/^(davon gesättigte fettsäuren|dont acides gras saturés|waarvan verzadigde vetzuren|di cui acidi grassi saturi|sat. fat|verz. vet|saturated fat|acides gras saturés)\b/.test(lower)) return "saturatedFat";

  // Carbohydrates
  if (/^(kohlenhydrate|glucides|koolhydraten|carboidrati|carbohydrates|koolhydraat)\b/.test(lower)) return "carbohydrates";

  // Sugars
  if (/^(davon zucker|dont sucres|waarvan suikers|di cui zuccheri|sugars|suikers|sucre)\b/.test(lower)) return "sugars";

  // Fiber
  if (/^(ballaststoffe|fibres alimentaires|vezels|fibre|fiber)\b/.test(lower)) return "fiber";

  // Protein
  if (/^(eiweiss|proteines|eiwitten|proteine|protein)\b/.test(lower)) return "protein";

  // Salt
  if (/^(salz|sel|zout|sale|salt)\b/.test(lower)) return "salt";

  return null;
}

/**
 * Extracts a numeric value from a string, handling comma decimals.
 * @param {string} str - The string to extract from
 * @returns {number|null} - The parsed number or null
 */
function extractNumber(str) {
  if (!str) return null;
  // Remove unit suffixes and whitespace
  const cleaned = str.trim().replace(/\s*\/.*$/, "").trim();
  // Try to find a number (with optional comma decimal)
  const match = cleaned.match(/^([\d]+)[,.]?([\d]*)$/);
  if (match) {
    return parseFloat(match[1] + "." + (match[2] || "0"));
  }
  return null;
}

/**
 * Parses OCR text from a nutrition label into structured data.
 * @param {string} text - The OCR text from a nutrition label
 * @returns {object} - Parsed nutrition data with per100g and perServing values
 */
export function parseNutritionTable(text) {
  if (!text || typeof text !== "string") return {};

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return {};

  // Detect if we have two value columns (per 100g and per serving)
  // by checking if any line has two numeric values separated by whitespace
  let hasTwoColumns = false;
  for (const line of lines) {
    // Skip header lines
    if (/^(nährwert|déclaration|nutrition|voedingswaarde|per|energie|fett|vet|koolhydraat)/i.test(line)) continue;
    // Check for pattern like "33 g  10 g" (two values with units)
    const valueMatches = line.match(/([\d]+[,.]?[\d]*)\s*(g|kj|kcal|ml|st|stück|pcs)\b.*?([\d]+[,.]?[\d]*)\s*(g|kj|kcal|ml|st|stück|pcs)\b/i);
    if (valueMatches) {
      hasTwoColumns = true;
      break;
    }
  }

  const result = {};
  let detectedUnit = "g";

  for (const line of lines) {
    // Skip header lines
    if (/^(nährwert|déclaration|nutrition|voedingswaarde|per\s|energie\s*\/|\/)/i.test(line)) continue;
    // Skip lines that are just a header like "Per glas (200 ml)"
    if (/^per\s/i.test(line) && line.includes("(")) continue;

    // Try to extract nutrient name and values
    // Pattern: nutrient name followed by value(s)
    // Two-column format: "Nutrient  33 g  10 g"
    // Single-column format: "Nutrient  33 g" or "Nutrient  2292 kJ / 549 kcal"

    let value100g = null;
    let valueServing = null;

    if (hasTwoColumns) {
      // Try two-column format
      const twoColMatch = line.match(/^([^\/\n]+?)\s+([\d]+[,.]?[\d]*)\s*(g|kj|kcal)\b.*?([\d]+[,.]?[\d]*)\s*(g|kj|kcal)\b/i);
      if (twoColMatch) {
        const name = mapNutrientName(twoColMatch[1]);
        if (name) {
          value100g = parseFloat(twoColMatch[2].replace(",", "."));
          valueServing = parseFloat(twoColMatch[4].replace(",", "."));
          // Detect unit from first value
          const unit = twoColMatch[3].toLowerCase();
          if (unit === "kj" || unit === "kcal") {
            detectedUnit = unit;
          } else {
            detectedUnit = "g";
          }
        }
      }
    }

    if (value100g === null && valueServing === null) {
      // Try single-column format
      // First check for energy with both kJ and kcal: "2292 kJ / 549 kcal"
      const energyMatch = line.match(/^([^\/\n]+?)\s+([\d]+[,.]?[\d]*)\s*(kj|kcal)\b\s*\/\s*([\d]+[,.]?[\d]*)\s*(kj|kcal)\b/i);
      if (energyMatch) {
        const name = mapNutrientName(energyMatch[1]);
        if (name === "energy") {
          value100g = parseFloat(energyMatch[2].replace(",", "."));
          // Check if first unit is kJ or kcal
          const unit1 = energyMatch[3].toLowerCase();
          if (unit1 === "kcal") {
            value100g = parseFloat(energyMatch[4].replace(",", "."));
            detectedUnit = "kcal";
          } else {
            detectedUnit = "kj";
          }
        }
      }

      if (value100g === null) {
        // Simple single value: "Nutrient  33 g" or "Nutrient  2292 kJ"
        const singleMatch = line.match(/^([^\/\n]+?)\s+([\d]+[,.]?[\d]*)\s*(g|kj|kcal)\b/i);
        if (singleMatch) {
          const name = mapNutrientName(singleMatch[1]);
          if (name) {
            value100g = parseFloat(singleMatch[2].replace(",", "."));
            const unit = singleMatch[3].toLowerCase();
            if (unit === "kj" || unit === "kcal") {
              detectedUnit = unit;
            } else {
              detectedUnit = "g";
            }
          }
        }
      }
    }

    if (value100g !== null || valueServing !== null) {
      const name = mapNutrientName(line);
      if (name) {
        if (!result[name]) {
          result[name] = { per100g: null, perServing: null, unit: detectedUnit };
        }
        if (value100g !== null) {
          result[name].per100g = value100g;
        }
        if (valueServing !== null) {
          result[name].perServing = valueServing;
        }
      }
    }
  }

  // If we detected no values at all, return empty
  const keys = Object.keys(result);
  if (keys.length === 0) return {};

  // If we never found a two-column pattern but have some values,
  // check if this is a "per serving only" table (no per100g values found)
  const hasAny100g = keys.some(k => result[k].per100g !== null);
  if (!hasAny100g) {
    // This is a per-serving only table
    for (const key of keys) {
      result[key].per100g = null;
    }
  }

  return result;
}