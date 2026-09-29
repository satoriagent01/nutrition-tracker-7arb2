/**
 * Storage module - CRUD operations for foods, meals, and preferences.
 * Works with any storage object that has getItem/setItem (e.g. localStorage).
 */

const FOODS_KEY = "nutrition-tracker-foods";
const MEALS_KEY = "nutrition-tracker-meals";
const PREFS_KEY = "nutrition-tracker-prefs";

/**
 * Loads all food items from storage.
 * @param {object} storage - Storage object with getItem/setItem
 * @returns {Array} Array of food objects
 */
export function loadFoods(storage) {
  const data = storage.getItem(FOODS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Saves a food item to storage (appends to existing list).
 * @param {object} storage - Storage object with getItem/setItem
 * @param {object} food - Food object to save
 */
export function saveFood(storage, food) {
  const foods = loadFoods(storage);
  // Check if food with same id already exists, if so update it
  const existingIndex = foods.findIndex((f) => f.id === food.id);
  if (existingIndex >= 0) {
    foods[existingIndex] = food;
  } else {
    foods.push(food);
  }
  storage.setItem(FOODS_KEY, JSON.stringify(foods));
}

/**
 * Loads all meals from storage.
 * @param {object} storage - Storage object with getItem/setItem
 * @returns {Array} Array of meal objects
 */
export function loadMeals(storage) {
  const data = storage.getItem(MEALS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Saves a meal to storage (appends to existing list).
 * @param {object} storage - Storage object with getItem/setItem
 * @param {object} meal - Meal object to save
 */
export function saveMeal(storage, meal) {
  const meals = loadMeals(storage);
  // Check if meal with same id already exists, if so update it
  const existingIndex = meals.findIndex((m) => m.id === meal.id);
  if (existingIndex >= 0) {
    meals[existingIndex] = meal;
  } else {
    meals.push(meal);
  }
  storage.setItem(MEALS_KEY, JSON.stringify(meals));
}

/**
 * Loads user preferences from storage.
 * @param {object} storage - Storage object with getItem/setItem
 * @returns {object} Preferences object
 */
export function loadPrefs(storage) {
  const data = storage.getItem(PREFS_KEY);
  if (!data) {
    return {
      trackedNutrients: ["energy", "fat", "saturatedFat", "sugars"],
      defaultServingUnit: "g",
    };
  }
  try {
    return JSON.parse(data);
  } catch {
    return {
      trackedNutrients: ["energy", "fat", "saturatedFat", "sugars"],
      defaultServingUnit: "g",
    };
  }
}

/**
 * Saves user preferences to storage.
 * @param {object} storage - Storage object with getItem/setItem
 * @param {object} prefs - Preferences object
 */
export function savePrefs(storage, prefs) {
  storage.setItem(PREFS_KEY, JSON.stringify(prefs));
}