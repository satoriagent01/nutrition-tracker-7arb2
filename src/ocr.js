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

  // First pass: detect if we have two columns (per 100g and per serving)
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for lines with two numeric values (two columns)
    const twoColMatch = trimmed.match(/^(.+?)\s+(\d+[.,]?\d*)\s*(kJ|kcal|g)\s+(\d+[.,]?\d*)\s*(kJ|kcal|g)\s*$/i);
    if (twoColMatch) {
      hasTwoColumns = true;
      // Detect unit from first value
      if (twoColMatch[3] === 'kJ' || twoColMatch[3] === 'kcal') {
        detectedUnit = twoColMatch[3];
      }
      break;
    }
  }

  // Second pass: parse each line
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header lines
    if (trimmed.match(/^(nährwert|déclaration|voedingswaarde|dichiarazione|per|energie|nutrition)/i) && 
        !trimmed.match(/\d/)) {
      continue;
    }

    let matched = false;

    if (hasTwoColumns) {
      // Try to match two-column format
      const twoColMatch = trimmed.match(/^(.+?)\s+(\d+[.,]?\d*)\s*(kJ|kcal|g)?\s+(\d+[.,]?\d*)\s*(kJ|kcal|g)?\s*$/);
      if (twoColMatch) {
        const label = twoColMatch[1].toLowerCase().trim();
        const val1 = parseFloat(twoColMatch[2].replace(',', '.'));
        const val2 = parseFloat(twoColMatch[4].replace(',', '.'));
        
        // Detect unit from first value if it's kJ or kcal
        if (twoColMatch[3] === 'kJ' || twoColMatch[3] === 'kcal') {
          detectedUnit = twoColMatch[3];
        }

        for (const [key, value] of Object.entries(nutrientMap)) {
          if (label.includes(key)) {
            result[value].per100g = val1;
            result[value].perServing = val2;
            result[value].unit = detectedUnit;
            matched = true;
            break;
          }
        }
      }
    }

    if (!matched) {
      // Try single column format
      const singleColMatch = trimmed.match(/^(.+?)\s+(\d+[.,]?\d*)\s*(kJ|kcal|g)?\s*$/);
      if (singleColMatch) {
        const label = singleColMatch[1].toLowerCase().trim();
        const val = parseFloat(singleColMatch[2].replace(',', '.'));
        
        // Detect unit
        if (singleColMatch[3] === 'kJ' || singleColMatch[3] === 'kcal') {
          detectedUnit = singleColMatch[3];
        }

        for (const [key, value] of Object.entries(nutrientMap)) {
          if (label.includes(key)) {
            result[value].per100g = val;
            result[value].unit = detectedUnit;
            matched = true;
            break;
          }
        }
      }
    }
  }

  // Check if any values were found
  const hasValues = allNutrients.some(n => result[n].per100g !== null || result[n].perServing !== null);
  if (!hasValues) {
    return {};
  }

  return result;
}