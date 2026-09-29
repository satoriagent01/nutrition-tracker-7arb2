/**
 * OCR module - parses nutrition table text into structured data
 */

/**
 * Maps common nutrient names (in various languages) to standard keys
 */
const nutrientMap = {
  // Energy
  'energie': 'energy',
  'énergie': 'energy',
  'energia': 'energy',
  'energy': 'energy',
  // Fat
  'fett': 'fat',
  'matières grasses': 'fat',
  'vetten': 'fat',
  'grassi': 'fat',
  'fat': 'fat',
  'fats': 'fat',
  // Saturated fat
  'gesättigte fettsäuren': 'saturatedFat',
  'acides gras saturés': 'saturatedFat',
  'verzadigde vetzuren': 'saturatedFat',
  'acidi grassi saturi': 'saturatedFat',
  'saturated fat': 'saturatedFat',
  'saturated fats': 'saturatedFat',
  'verz. vet': 'saturatedFat',
  // Carbohydrates
  'kohlenhydrate': 'carbohydrates',
  'glucides': 'carbohydrates',
  'koolhydraten': 'carbohydrates',
  'carboidrati': 'carbohydrates',
  'carbohydrates': 'carbohydrates',
  'carbs': 'carbohydrates',
  // Sugars
  'zucker': 'sugars',
  'sucres': 'sugars',
  'suikers': 'sugars',
  'zuccheri': 'sugars',
  'sugars': 'sugars',
  'sugar': 'sugars',
  // Fiber
  'ballaststoffe': 'fiber',
  'fibres alimentaires': 'fiber',
  'vezels': 'fiber',
  'fibre': 'fiber',
  'fiber': 'fiber',
  'fibres': 'fiber',
  // Protein
  'eiweiß': 'protein',
  ' protéines': 'protein',
  'eiwitten': 'protein',
  'proteïne': 'protein',
  'protein': 'protein',
  'proteins': 'protein',
  // Salt
  'salz': 'salt',
  'sel': 'salt',
  'zout': 'salt',
  'sale': 'salt',
  'salt': 'salt',
  'sodium': 'salt',
};

/**
 * Parse a nutrition table from OCR text
 * @param {string} text - OCR extracted text from a nutrition label
 * @returns {object} Parsed nutrition data with per100g and perServing values
 */
export function parseNutritionTable(text) {
  const result = {};
  const lines = text.split('\n');

  // Initialize all nutrients with null
  const allNutrients = ['energy', 'fat', 'saturatedFat', 'carbohydrates', 'sugars', 'fiber', 'protein', 'salt'];
  for (const nutrient of allNutrients) {
    result[nutrient] = { per100g: null, perServing: null, unit: 'g' };
  }

  let hasTwoColumns = false;
  let detectedUnit = 'g';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header lines
    if (trimmed.includes('Nährwertdeklaration') ||
        trimmed.includes('Déclaration nutritionnelle') ||
        trimmed.includes('Voedingswaarde') ||
        trimmed.includes('Dichiarazione nutrizionale') ||
        trimmed.includes('Per glas') ||
        trimmed.includes('Pro 100') ||
        trimmed.includes('Per 100') ||
        trimmed.includes('Pro porzione') ||
        trimmed.includes('Per serving') ||
        trimmed.includes('Per porzione')) {
      continue;
    }

    // Try to match a nutrient line
    // Pattern: nutrient name (possibly with slashes) followed by values
    // Examples:
    // "Energie / énergie / energie / energia  2292 kJ  688 kJ"
    // "energie  199 kJ / 47 kcal"
    // "Fett  33 g  10 g"
    // "davon gesättigte Fettsäuren  13,2 g"

    // Try to find a known nutrient name in the line
    let matchedNutrient = null;
    let matchedName = '';

    // Split by slashes to get the main name part
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length >= 2) {
      const namePart = parts[0].replace(/^-/, '').trim();
      // Check if any part of the name (before slashes) matches a known nutrient
      const nameCandidates = namePart.split('/').map(n => n.trim().toLowerCase());

      for (const candidate of nameCandidates) {
        // Remove leading dashes and spaces
        const cleanCandidate = candidate.replace(/^-/, '').trim();
        if (nutrientMap[cleanCandidate]) {
          matchedNutrient = nutrientMap[cleanCandidate];
          matchedName = cleanCandidate;
          break;
        }
      }
    }

    if (!matchedNutrient) continue;

    // Get the value part (everything after the name)
    const nameEndIndex = trimmed.indexOf(matchedName);
    if (nameEndIndex === -1) continue;

    const valuePart = trimmed.substring(nameEndIndex + matchedName.length).trim();

    // Extract numeric values from the value part
    // Handle formats like:
    // "2292 kJ  688 kJ" -> two values
    // "199 kJ / 47 kcal" -> two values (energy specific)
    // "33 g  10 g" -> two values
    // "13,2 g" -> one value
    // "2292 kJ / 549 kcal" -> two values (energy specific)

    // Try to find all numbers (including comma decimals)
    const numberRegex = /(\d+[,.]?\d*)/g;
    const numbers = [];
    let match;
    while ((match = numberRegex.exec(valuePart)) !== null) {
      numbers.push(parseFloat(match[1].replace(',', '.')));
    }

    // Detect unit from the value part
    if (valuePart.includes('kJ')) {
      detectedUnit = 'kJ';
    } else if (valuePart.includes('kcal')) {
      detectedUnit = 'kcal';
    }

    if (numbers.length >= 2) {
      // Two values: per 100g and per serving
      result[matchedNutrient].per100g = numbers[0];
      result[matchedNutrient].perServing = numbers[1];
      hasTwoColumns = true;
    } else if (numbers.length === 1) {
      // One value: could be per 100g or per serving
      // Check if we've seen two-column data before
      if (hasTwoColumns) {
        // This line has only one value but we've seen two columns before
        // This is likely a sub-item (like "davon Zucker") that only has per 100g
        // or it's a continuation line
        // For now, assume it's per 100g if we haven't set it yet
        if (result[matchedNutrient].per100g === null) {
          result[matchedNutrient].per100g = numbers[0];
        }
      } else {
        // No two-column data seen yet, assume per 100g
        result[matchedNutrient].per100g = numbers[0];
      }
    }
  }

  // Set units
  for (const nutrient of allNutrients) {
    result[nutrient].unit = detectedUnit;
  }

  // Check if we found any data
  const hasData = allNutrients.some(n => result[n].per100g !== null || result[n].perServing !== null);
  if (!hasData) {
    return {};
  }

  return result;
}