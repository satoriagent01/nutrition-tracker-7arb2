/**
 * Storage module - CRUD operations for foods, meals, and preferences.
 * Works with any storage object that has getItem/setItem (e.g. localStorage).
 */

const FOODS_KEY = "nutrition-tracker-foods";
const MEALS_KEY = "nutrition-tracker-meals";
const PREFS_KEY = "nutrition-tracker-prefs";

/**
 * Storage class that provides a clean API for food, meal, and preference management.
 */
export class Storage {
  constructor(storageObj) {
    this.storage = storageObj || (typeof localStorage !== "undefined" ? localStorage : {
      getItem: () => null,
      setItem: () => {},
    });
  }

  /**
   * Adds a new food entry.
   * @param {object} food - Food object with id, name, servingSize, servingUnit, nutrition
   */
  addFood(food) {
    const foods = this.loadFoods();
    const existingIndex = foods.findIndex((f) => f.id === food.id);
    if (existingIndex >= 0) {
      foods[existingIndex] = food;
    } else {
      foods.push(food);
    }
    this.storage.setItem(FOODS_KEY, JSON.stringify(foods));
  }

  /**
   * Updates an existing food entry.
   * @param {object} food - Updated food object
   */
  updateFood(food) {
    this.addFood(food);
  }

  /**
   * Deletes a food entry by id.
   * @param {string} foodId - The food id to delete
   */
  deleteFood(foodId) {
    const foods = this.loadFoods();
    const filtered = foods.filter((f) => f.id !== foodId);
    this.storage.setItem(FOODS_KEY, JSON.stringify(filtered));
  }

  /**
   * Gets a food entry by id.
   * @param {string} foodId - The food id
   * @returns {object|undefined} The food object or undefined
   */
  getFood(foodId) {
    const foods = this.loadFoods();
    return foods.find((f) => f.id === foodId);
  }

  /**
   * Lists all foods.
   * @returns {Array} Array of food objects
   */
  listFoods() {
    return this.loadFoods();
  }

  /**
   * Adds a new meal entry.
   * @param {object} meal - Meal object with id, name, items, createdAt
   */
  addMeal(meal) {
    const meals = this.loadMeals();
    const existingIndex = meals.findIndex((m) => m.id === meal.id);
    if (existingIndex >= 0) {
      meals[existingIndex] = meal;
    } else {
      meals.push(meal);
    }
    this.storage.setItem(MEALS_KEY, JSON.stringify(meals));
  }

  /**
   * Updates an existing meal entry.
   * @param {object} meal - Updated meal object
   */
  updateMeal(meal) {
    this.addMeal(meal);
  }

  /**
   * Deletes a meal entry by id.
   * @param {string} mealId - The meal id to delete
   */
  deleteMeal(mealId) {
    const meals = this.loadMeals();
    const filtered = meals.filter((m) => m.id !== mealId);
    this.storage.setItem(MEALS_KEY, JSON.stringify(filtered));
  }

  /**
   * Gets a meal entry by id.
   * @param {string} mealId - The meal id
   * @returns {object|undefined} The meal object or undefined
   */
  getMeal(mealId) {
    const meals = this.loadMeals();
    return meals.find((m) => m.id === mealId);
  }

  /**
   * Lists all meals.
   * @returns {Array} Array of meal objects
   */
  listMeals() {
    return this.loadMeals();
  }

  /**
   * Gets user preferences.
   * @returns {object} Preferences object
   */
  getPrefs() {
    return this.loadPrefs();
  }

  /**
   * Saves user preferences.
   * @param {object} prefs - Preferences object
   */
  savePrefs(prefs) {
    this.storage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  // Private helpers

  loadFoods() {
    const data = this.storage.getItem(FOODS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  loadMeals() {
    const data = this.storage.getItem(MEALS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  loadPrefs() {
    const data = this.storage.getItem(PREFS_KEY);
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
}