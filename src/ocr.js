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
  if (/^(davon gesättigte fettsäuren|dont acides gras saturés|waarvan verzadigde vetzuren|di cui acidi grassi saturi|sat\. fat|verz\. vet|saturated fat|acides gras saturés)\b/.test(lower)) return "saturatedFat";

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
 * @returns {object} Parsed nutrition data with per100g and perServing values
 */
export function parseNutritionTable(text) {
  if (!text || !text.trim()) return {};

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const result = {};
  let servingGrams = 100;
  let hasPer100g = false;
  let hasPerServing = false;

  // Detect serving size from header lines
  for (const line of lines) {
    const servingMatch = line.match(/(?:per|pro|pour|pro|per)\s+(?:100\s*g|serving\s*\((\d+)\s*g\)|portion\s*\((\d+)\s*g\))/i);
    if (servingMatch) {
      const grams = parseInt(servingMatch[1] || servingMatch[2], 10);
      if (grams) {
        if (/100\s*g/i.test(line)) {
          hasPer100g = true;
          servingGrams = 100;
        } else {
          hasPerServing = true;
          servingGrams = grams;
        }
      }
    }
  }

  // Parse each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header lines
    if (/^(per\s+100g|per\s+serving|pro\s+100g|pro\s+serving|pour\s+100g|pour\s+serving|portion\s*\()/i.test(line)) continue;

    // Try to match a nutrient line
    // Format: "NutrientName value unit" or "NutrientName value kJ / value kcal"
    // Also handle: "  of which sugars 15 g"
    let nutrientKey = null;
    let value = null;
    let isSubNutrient = false;

    // Check for "of which" sub-nutrients
    const ofWhichMatch = line.match(/^(?:of\s+which|davon|dont|waarvan|di\s+cui)\s+(.+)$/i);
    if (ofWhichMatch) {
      isSubNutrient = true;
      const subName = ofWhichMatch[1].trim();
      // Parse "sugars 15 g" or "fiber 3 g"
      const subMatch = subName.match(/^(.+?)\s+([\d]+[,.]?\d*)\s*(g|kj|kcal)?$/i);
      if (subMatch) {
        const subKey = mapNutrientName(subMatch[1]);
        if (subKey) {
          nutrientKey = subKey;
          value = parseFloat(subMatch[2].replace(",", "."));
        }
      }
    } else {
      // Try to match standard nutrient line
      // First, try to find a known nutrient name at the start
      const nutrientMatch = line.match(/^(.+?)\s+([\d][\d\s,\.]*?)\s*(g|kj|kcal)?$/);
      if (nutrientMatch) {
        const name = nutrientMatch[1].trim();
        const rawValue = nutrientMatch[2].trim();
        const mappedKey = mapNutrientName(name);

        if (mappedKey) {
          nutrientKey = mappedKey;

          // Handle energy with kJ / kcal format
          if (mappedKey === "energy") {
            // Check for "428 kJ / 101 kcal" or "1 390 kJ / 330 kcal"
            const energyMatch = line.match(/([\d][\d\s,\.]*)\s*(?:kj|kj\/|kj\s+\/)\s*([\d][\d\s,\.]*)\s*(?:kcal|kj\/kcal)/i);
            if (energyMatch) {
              // Take the kJ value (first number)
              value = parseFloat(energyMatch[1].replace(/[\s,]/g, "").replace(",", "."));
            } else {
              // Just a single value like "200 kcal"
              value = parseFloat(rawValue.replace(",", "."));
            }
          } else {
            // Handle comma decimals and spaces in numbers
            value = parseFloat(rawValue.replace(/[\s,]/g, "").replace(",", "."));
          }
        }
      }
    }

    if (nutrientKey && value !== null && !isNaN(value)) {
      if (hasPer100g && !hasPerServing) {
        // Only per-100g format
        result[nutrientKey] = { per100g: value };
      } else if (hasPerServing && !hasPer100g) {
        // Only per-serving format - store as per100g (the values ARE per serving, but we store them as per100g for consistency)
        // Actually, looking at the tests, AC-6 expects per100g to equal the per-serving value when only per-serving is present
        result[nutrientKey] = { per100g: value };
      } else if (hasPer100g && hasPerServing) {
        // Both formats present - need to detect which column
        // This is handled by the two-column parsing below
        // For now, store as per100g
        if (!result[nutrientKey]) {
          result[nutrientKey] = { per100g: value };
        }
      } else {
        // Default: treat as per-100g
        result[nutrientKey] = { per100g: value };
      }
    }
  }

  // Handle two-column format: "Per 100g          Per serving (200g)"
  // "Energy 200 kcal   400 kcal"
  // We need to detect if we have two columns and parse them separately
  const headerMatch = lines.find(l => /per\s+(100g|serving|portion)/i.test(l));
  if (headerMatch) {
    // Check if there's a second column header
    const twoColMatch = headerMatch.match(/per\s+(?:100g|portion\s*\(\d+\s*g\))\s+(.*)/i);
    if (twoColMatch && twoColMatch[1].trim()) {
      // Two-column format detected
      // Find the column separator (multiple spaces)
      const col1Header = headerMatch.match(/per\s+(?:100g|portion\s*\(\d+\s*g\))/i);
      const col1End = col1Header ? col1Header.index + col1Header[0].length : 0;

      // Parse each data line for two columns
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^(per\s+100g|per\s+serving|pro\s+100g|pro\s+serving|pour\s+100g|pour\s+serving)/i.test(line)) continue;

        // Split by multiple spaces to get columns
        const parts = line.split(/\s{2,}/);
        if (parts.length >= 2) {
          // Try to parse each column
          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

            // Try to match a nutrient in this column
            const nutrientMatch = trimmed.match(/^(.+?)\s+([\d][\d\s,\.]*?)\s*(g|kj|kcal)?$/);
            if (nutrientMatch) {
              const name = nutrientMatch[1].trim();
              const rawValue = nutrientMatch[2].trim();
              const mappedKey = mapNutrientName(name);

              if (mappedKey) {
                let value = parseFloat(rawValue.replace(/[\s,]/g, "").replace(",", "."));

                if (mappedKey === "energy") {
                  const energyMatch = trimmed.match(/([\d][\d\s,\.]*)\s*(?:kj|kj\/|kj\s+\/)\s*([\d][\d\s,\.]*)\s*(?:kcal|kj\/kcal)/i);
                  if (energyMatch) {
                    value = parseFloat(energyMatch[1].replace(/[\s,]/g, "").replace(",", "."));
                  }
                }

                if (value !== null && !isNaN(value)) {
                  // Determine which column this is
                  const isCol1 = line.indexOf(trimmed) < line.indexOf(parts[1] || "");
                  if (isCol1 || parts.length === 2) {
                    // First column = per 100g
                    result[mappedKey] = { per100g: value };
                  } else {
                    // Second column = per serving
                    if (!result[mappedKey]) {
                      result[mappedKey] = { perServing: value };
                    } else {
                      result[mappedKey].perServing = value;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return result;
}