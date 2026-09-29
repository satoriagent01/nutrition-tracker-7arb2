/**
 * Nutrition scaling module - deterministic scaling of nutrition values.
 */

/**
 * Scales nutrition values from per 100g to a given gram amount.
 * @param {object} per100g - Nutrition values per 100g
 * @param {number} grams - Amount in grams to scale to
 * @returns {object} Scaled nutrition values
 */
export function scaleNutrition(per100g, grams) {
  const factor = grams / 100;
  const result = {};
  for (const key of Object.keys(per100g)) {
    result[key] = Math.round(per100g[key] * factor * 1e10) / 1e10;
  }
  return result;
}

/**
 * Calculates per-gram values from per-100g values.
 * @param {object} per100g - Nutrition values per 100g
 * @returns {object} Per-gram values
 */
export function calculatePerGram(per100g) {
  const result = {};
  for (const key of Object.keys(per100g)) {
    result[key] = Math.round(per100g[key] / 100 * 1e10) / 1e10;
  }
  return result;
}

/**
 * Aggregates nutrition values from multiple sources.
 * @param {Array<object>} nutritionValues - Array of nutrition value objects
 * @returns {object} Aggregated nutrition values
 */
export function aggregateNutrition(nutritionValues) {
  const result = {};
  for (const values of nutritionValues) {
    for (const key of Object.keys(values)) {
      if (!result[key]) {
        result[key] = 0;
      }
      result[key] += values[key] || 0;
    }
  }
  // Round all values to avoid floating point issues
  for (const key of Object.keys(result)) {
    result[key] = Math.round(result[key] * 1e10) / 1e10;
  }
  return result;
}