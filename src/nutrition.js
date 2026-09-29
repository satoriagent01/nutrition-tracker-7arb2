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
    result[key] = per100g[key] * factor;
  }
  return result;
}