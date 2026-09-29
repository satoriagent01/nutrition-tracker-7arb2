import { parseNutritionTable } from "../src/ocr.js";
import { scaleNutrition } from "../src/nutrition.js";
import {
  loadFoods,
  saveFood,
  loadMeals,
  saveMeal,
  loadPrefs,
  savePrefs,
} from "../src/storage.js";
import { createMeal, getMealTotal, getDailyTotal } from "../src/meals.js";

// Storage key constants
const FOODS_KEY = "nutrition-tracker-foods";
const MEALS_KEY = "nutrition-tracker-meals";
const PREFS_KEY = "nutrition-tracker-prefs";

// Default preferences
const DEFAULT_PREFS = {
  trackedNutrients: ["energy", "fat", "saturatedFat", "carbohydrates", "sugars", "protein", "salt"],
  aiUrl: "",
  aiKey: "",
  aiModel: "",
};

// State
let foods = [];
let meals = [];
let prefs = { ...DEFAULT_PREFS };
let currentPreviewImage = null;

// DOM elements
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

// Initialize app
function init() {
  loadData();
  setupTabs();
  setupUploadArea();
  setupFoodForm();
  setupMealForm();
  setupSettings();
  renderFoods();
  renderMeals();
  renderNutrientChecks();
  renderDailyTotals();
}

// Load data from storage
function loadData() {
  const storedFoods = localStorage.getItem(FOODS_KEY);
  foods = storedFoods ? JSON.parse(storedFoods) : [];

  const storedMeals = localStorage.getItem(MEALS_KEY);
  meals = storedMeals ? JSON.parse(storedMeals) : [];

  const storedPrefs = localStorage.getItem(PREFS_KEY);
  prefs = storedPrefs ? { ...DEFAULT_PREFS, ...JSON.parse(storedPrefs) } : { ...DEFAULT_PREFS };

  // Populate settings fields
  document.getElementById("settings-ai-url").value = prefs.aiUrl || "";
  document.getElementById("settings-ai-key").value = prefs.aiKey || "";
  document.getElementById("settings-ai-model").value = prefs.aiModel || "";
}

// Save data to storage
function saveData() {
  localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Setup tab navigation
function setupTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      const tabId = tab.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add("active");

      if (tabId === "track") {
        renderDailyTotals();
      }
    });
  });
}

// Setup upload area
function setupUploadArea() {
  const uploadArea = document.getElementById("upload-area");
  const fileInput = document.getElementById("file-input");
  const cameraBtn = document.getElementById("camera-btn");

  uploadArea.addEventListener("click", () => fileInput.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#4CAF50";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.borderColor = "#ccc";
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#ccc";
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  });

  cameraBtn.addEventListener("click", () => {
    fileInput.setAttribute("capture", "environment");
    fileInput.click();
  });
}

// Handle file upload
function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentPreviewImage = e.target.result;
    document.getElementById("preview-image").src = currentPreviewImage;
    document.getElementById("preview-container").classList.remove("hidden");
    document.getElementById("upload-area").classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

// Setup food form
function setupFoodForm() {
  const addFoodBtn = document.getElementById("add-food-btn");
  const foodForm = document.getElementById("food-form");
  const cancelFoodBtn = document.getElementById("cancel-food-btn");

  addFoodBtn.addEventListener("click", () => {
    foodForm.classList.remove("hidden");
  });

  cancelFoodBtn.addEventListener("click", () => {
    foodForm.classList.add("hidden");
    clearFoodForm();
  });

  document.getElementById("save-new-food-btn").addEventListener("click", () => {
    const name = document.getElementById("new-food-name").value.trim();
    if (!name) {
      alert("Please enter a food name.");
      return;
    }

    const food = {
      id: `food-${Date.now()}`,
      name,
      energy: parseFloat(document.getElementById("new-food-energy").value) || 0,
      fat: parseFloat(document.getElementById("new-food-fat").value) || 0,
      saturatedFat: parseFloat(document.getElementById("new-food-sat-fat").value) || 0,
      carbohydrates: parseFloat(document.getElementById("new-food-carbs").value) || 0,
      sugars: parseFloat(document.getElementById("new-food-sugars").value) || 0,
      fiber: parseFloat(document.getElementById("new-food-fiber").value) || 0,
      protein: parseFloat(document.getElementById("new-food-protein").value) || 0,
      salt: parseFloat(document.getElementById("new-food-salt").value) || 0,
      servingSize: parseInt(document.getElementById("new-food-serving").value) || 100,
    };

    saveFood({
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    }, food);

    foods.push(food);
    saveData();
    renderFoods();
    foodForm.classList.add("hidden");
    clearFoodForm();
  });
}

// Setup meal form
function setupMealForm() {
  const addMealBtn = document.getElementById("add-meal-btn");
  const mealForm = document.getElementById("meal-form");
  const cancelMealBtn = document.getElementById("cancel-meal-btn");

  addMealBtn.addEventListener("click", () => {
    mealForm.classList.remove("hidden");
    document.getElementById("new-meal-name").value = "";
    document.getElementById("meal-items").innerHTML = "";
  });

  cancelMealBtn.addEventListener("click", () => {
    mealForm.classList.add("hidden");
  });

  document.getElementById("add-meal-item-btn").addEventListener("click", () => {
    const mealItems = document.getElementById("meal-items");
    const itemDiv = document.createElement("div");
    itemDiv.className = "meal-item-row";

    const select = document.createElement("select");
    select.className = "meal-food-select";
    foods.forEach((food) => {
      const option = document.createElement("option");
      option.value = food.id;
      option.textContent = food.name;
      select.appendChild(option);
    });

    const gramsInput = document.createElement("input");
    gramsInput.type = "number";
    gramsInput.placeholder = "Grams";
    gramsInput.className = "meal-grams-input";
    gramsInput.min = "0";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "secondary";
    removeBtn.addEventListener("click", () => itemDiv.remove());

    itemDiv.appendChild(select);
    itemDiv.appendChild(gramsInput);
    itemDiv.appendChild(removeBtn);
    mealItems.appendChild(itemDiv);
  });

  document.getElementById("save-meal-btn").addEventListener("click", () => {
    const name = document.getElementById("new-meal-name").value.trim();
    if (!name) {
      alert("Please enter a meal name.");
      return;
    }

    const itemRows = document.querySelectorAll(".meal-item-row");
    const items = [];

    itemRows.forEach((row) => {
      const foodId = row.querySelector(".meal-food-select").value;
      const grams = parseFloat(row.querySelector(".meal-grams-input").value) || 0;
      if (foodId && grams > 0) {
        items.push({ foodId, grams });
      }
    });

    if (items.length === 0) {
      alert("Please add at least one food item.");
      return;
    }

    const meal = createMeal(name, items);
    saveMeal({
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    }, meal);

    meals.push(meal);
    saveData();
    renderMeals();
    mealForm.classList.add("hidden");
  });
}

// Setup settings
function setupSettings() {
  document.getElementById("save-settings-btn").addEventListener("click", () => {
    prefs.aiUrl = document.getElementById("settings-ai-url").value;
    prefs.aiKey = document.getElementById("settings-ai-key").value;
    prefs.aiModel = document.getElementById("settings-ai-model").value;

    // Update tracked nutrients
    const checks = document.querySelectorAll(".nutrient-check input");
    prefs.trackedNutrients = [];
    checks.forEach((check) => {
      if (check.checked) {
        prefs.trackedNutrients.push(check.value);
      }
    });

    saveData();
    alert("Settings saved!");
  });

  document.getElementById("clear-data-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all data?")) {
      localStorage.clear();
      foods = [];
      meals = [];
      prefs = { ...DEFAULT_PREFS };
      saveData();
      renderFoods();
      renderMeals();
      renderNutrientChecks();
      renderDailyTotals();
    }
  });
}

// Render foods list
function renderFoods() {
  const foodList = document.getElementById("food-list");
  foodList.innerHTML = "";

  foods.forEach((food) => {
    const li = document.createElement("li");
    li.className = "food-item";
    li.innerHTML = `
      <span><strong>${food.name}</strong></span>
      <span>${food.energy} kJ / ${food.servingSize}g serving</span>
      <button class="danger" onclick="deleteFood('${food.id}')">Delete</button>
    `;
    foodList.appendChild(li);
  });
}

// Delete food
function deleteFood(id) {
  foods = foods.filter((f) => f.id !== id);
  saveData();
  renderFoods();
}

// Render meals list
function renderMeals() {
  const mealList = document.getElementById("meal-list");
  mealList.innerHTML = "";

  meals.forEach((meal) => {
    const total = getMealTotal(meal, foods);
    const li = document.createElement("li");
    li.className = "meal-item";
    li.innerHTML = `
      <span><strong>${meal.name}</strong></span>
      <span>${total.energy} kJ, ${total.fat}g fat</span>
      <button class="danger" onclick="deleteMeal('${meal.id}')">Delete</button>
    `;
    mealList.appendChild(li);
  });
}

// Delete meal
function deleteMeal(id) {
  meals = meals.filter((m) => m.id !== id);
  saveData();
  renderMeals();
}

// Render nutrient checks in settings
function renderNutrientChecks() {
  const allNutrients = [
    { key: "energy", label: "Energy (kJ)" },
    { key: "fat", label: "Fat (g)" },
    { key: "saturatedFat", label: "Saturated Fat (g)" },
    { key: "carbohydrates", label: "Carbohydrates (g)" },
    { key: "sugars", label: "Sugars (g)" },
    { key: "fiber", label: "Fiber (g)" },
    { key: "protein", label: "Protein (g)" },
    { key: "salt", label: "Salt (g)" },
  ];

  const container = document.getElementById("nutrient-checks");
  container.innerHTML = "";

  allNutrients.forEach((nutrient) => {
    const label = document.createElement("label");
    const checked = prefs.trackedNutrients.includes(nutrient.key) ? "checked" : "";
    label.innerHTML = `
      <input type="checkbox" value="${nutrient.key}" ${checked}>
      ${nutrient.label}
    `;
    container.appendChild(label);
  });
}

// Render daily totals
function renderDailyTotals() {
  const totalsDisplay = document.getElementById("totals-display");
  totalsDisplay.innerHTML = "";

  if (meals.length === 0) {
    totalsDisplay.innerHTML = "<p>No meals added yet.</p>";
    return;
  }

  const totals = getDailyTotal(meals, foods, prefs.trackedNutrients);

  Object.entries(totals).forEach(([nutrient, value]) => {
    const div = document.createElement("div");
    div.className = "total-item";
    const labels = {
      energy: "Energy",
      fat: "Fat",
      saturatedFat: "Saturated Fat",
      carbohydrates: "Carbohydrates",
      sugars: "Sugars",
      fiber: "Fiber",
      protein: "Protein",
      salt: "Salt",
    };
    const units = {
      energy: " kJ",
      fat: " g",
      saturatedFat: " g",
      carbohydrates: " g",
      sugars: " g",
      fiber: " g",
      protein: " g",
      salt: " g",
    };
    div.innerHTML = `
      <span class="total-label">${labels[nutrient] || nutrient}</span>
      <span class="total-value">${value.toFixed(1)}${units[nutrient] || ""}</span>
    `;
    totalsDisplay.appendChild(div);
  });
}

// Clear food form
function clearFoodForm() {
  document.getElementById("new-food-name").value = "";
  document.getElementById("new-food-energy").value = "";
  document.getElementById("new-food-fat").value = "";
  document.getElementById("new-food-sat-fat").value = "";
  document.getElementById("new-food-carbs").value = "";
  document.getElementById("new-food-sugars").value = "";
  document.getElementById("new-food-fiber").value = "";
  document.getElementById("new-food-protein").value = "";
  document.getElementById("new-food-salt").value = "";
  document.getElementById("new-food-serving").value = "";
}

// Initialize on load
document.addEventListener("DOMContentLoaded", init);