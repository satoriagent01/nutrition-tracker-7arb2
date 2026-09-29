/**
 * Meal planning module - meal creation and nutrition aggregation.
 */

import { scaleNutrition } from "./nutrition.js";

/**
 * Creates a meal with items.
 * @param {string} name - Name of the meal
 * @param {Array} items - Array of { foodId, grams }
 * @returns {object} Meal object with id, name, items, createdAt
 */
export function createMeal(name, items) {
  return {
    id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    items,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Gets the total nutrition for a meal by looking up each food and scaling.
 * @param {object} meal - Meal object with items
 * @param {object} foods - Food database { [foodId]: foodObject }
 * @returns {object} Total nutrition values
 */
export function getMealTotal(meal, foods) {
  const totals = {
    energy: 0,
    fat: 0,
    saturatedFat: 0,
    carbohydrates: 0,
    sugars: 0,
    fiber: 0,
    protein: 0,
    salt: 0,
  };

  for (const item of meal.items) {
    const food = foods[item.foodId];
    if (!food) continue;

    const per100g = {
      energy: food.energy || 0,
      fat: food.fat || 0,
      saturatedFat: food.saturatedFat || 0,
      carbohydrates: food.carbohydrates || 0,
      sugars: food.sugars || 0,
      fiber: food.fiber || 0,
      protein: food.protein || 0,
      salt: food.salt || 0,
    };

    const scaled = scaleNutrition(per100g, item.grams);

    for (const key of Object.keys(totals)) {
      totals[key] += scaled[key] || 0;
    }
  }

  // Round all values to avoid floating point issues
  for (const key of Object.keys(totals)) {
    totals[key] = Math.round(totals[key] * 1e10) / 1e10;
  }

  return totals;
}

/**
 * Gets the daily total across all meals.
 * @param {Array} meals - Array of meal objects
 * @param {object} foods - Food database { [foodId]: foodObject }
 * @param {Array} trackedNutrients - Array of nutrient keys to track
 * @returns {object} Total nutrition values for tracked nutrients
 */
export function getDailyTotal(meals, foods, trackedNutrients) {
  const totals = {};
  for (const nutrient of trackedNutrients) {
    totals[nutrient] = 0;
  }

  for (const meal of meals) {
    const mealTotal = getMealTotal(meal, foods);
    for (const nutrient of trackedNutrients) {
      totals[nutrient] += mealTotal[nutrient] || 0;
    }
  }

  // Round all values to avoid floating point issues
  for (const key of Object.keys(totals)) {
    totals[key] = Math.round(totals[key] * 1e10) / 1e10;
  }

  return totals;
}