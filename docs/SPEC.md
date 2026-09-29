# Nutrition Tracker - Product Specification

## Overview

A free, ad-free nutrition tracker web application that allows users to:
1. Take photos of nutrition labels from food products
2. Use OCR with AI to extract nutritional information from the photos
3. Store and track nutritional data for custom foods/meals
4. Create meal plans by specifying grams of each food item
5. Track custom metrics: calories, sodium, saturated fats, or any other nutrients

## User Stories

- As a user, I want to take a photo of a nutrition label so I can quickly add food information
- As a user, I want the app to extract nutritional data from the photo using OCR
- As a user, I want to create custom foods with their nutritional information
- As a user, I want to create meal plans by adding foods with custom gram amounts
- As a user, I want to track specific nutrients I care about (calories, sodium, saturated fats, etc.)
- As a user, I want to see a summary of my nutritional intake for meals

## Functional Requirements

### 1. Photo Capture & OCR
- Users can capture or upload photos of nutrition labels
- OCR with AI extracts nutritional information from the photos
- Extracted data includes: energy (kJ/kcal), fats, saturated fats, carbohydrates, sugars, protein, salt/sodium
- Users can review and edit extracted data before saving

### 2. Food Database
- Users can create custom food entries
- Each food entry includes: name, nutritional values per 100g
- Foods can be saved for future use

### 3. Meal Planning
- Users can create meals by adding food items
- Users specify the amount (in grams) of each food
- The app calculates total nutritional values based on the amounts

### 4. Nutritional Tracking
- Users can select which nutrients to track
- The app shows totals for selected nutrients
- Users can view daily/weekly summaries

## Non-Functional Requirements

- **Free and ad-free**: The application must be completely free to use with no advertisements
- **Responsive design**: The app should work on both desktop and mobile devices
- **Performance**: OCR processing should complete within a reasonable time
- **Privacy**: User data should be stored locally when possible

## Technical Constraints

- **Web application**: Built as a static web page
- **OCR integration**: Uses OpenAI-compatible endpoint for OCR processing
- **No build step**: Uses Node.js with ES modules
- **Browser-based**: UI runs in the browser with localStorage for data persistence

## Data Model

### Food
- `id`: string (unique identifier)
- `name`: string
- `nutritionalValues`: object with values per 100g
  - `energyKj`: number
  - `energyKcal`: number
  - `fat`: number
  - `saturatedFat`: number
  - `carbohydrates`: number
  - `sugars`: number
  - `protein`: number
  - `salt`: number

### Meal
- `id`: string (unique identifier)
- `name`: string
- `foods`: array of food entries with amounts
  - `foodId`: string (reference to food)
  - `amountGrams`: number

### User Preferences
- `trackedNutrients`: array of nutrient names to display
- `ocrConfig`: object with OCR endpoint configuration
  - `url`: string
  - `key`: string
  - `model`: string

## UI/UX Guidelines

- Clean, simple interface
- Intuitive navigation between sections
- Clear display of nutritional information
- Easy photo capture and upload process
- Responsive layout for mobile and desktop

## Acceptance Criteria

### AC-1: Photo Capture
- Users can capture or upload photos of nutrition labels
- The app accepts common image formats (JPEG, PNG)
- Photos are displayed for review before processing

### AC-2: OCR Processing
- The app sends photos to the configured OCR endpoint
- Nutritional data is extracted from the photos
- Users can review and edit the extracted data
- Example: From a photo of a nutrition label showing "Energie: 2292 kJ / 549 kcal per 100g", the app extracts energyKj: 2292, energyKcal: 549

### AC-3: Food Database
- Users can create custom food entries
- Each food entry stores nutritional values per 100g
- Foods can be saved and retrieved later
- Example: A food entry for "Apple" with energyKcal: 52, fat: 0.2, carbohydrates: 13.8 per 100g

### AC-4: Meal Planning
- Users can create meals by adding food items
- Users specify the amount of each food in grams
- The app calculates total nutritional values
- Example: A meal with 150g of "Apple" (energyKcal: 52 per 100g) shows total energyKcal: 78

### AC-5: Nutritional Tracking
- Users can select which nutrients to track
- The app shows totals for selected nutrients
- Users can view summaries of their intake
- Example: User tracks calories, sodium, and saturated fats; the app shows totals for these three nutrients

### AC-6: Custom Metrics
- Users can choose any nutrients to monitor
- The app displays custom metrics in the dashboard
- Users can add or remove tracked nutrients
- Example: User adds "sodium" to their tracked nutrients list

### AC-7: Free and Ad-Free
- The application has no advertisements
- All features are available without payment
- No premium tiers or paywalls

### AC-8: Responsive Design
- The app works on mobile devices
- The app works on desktop browsers
- The layout adapts to different screen sizes

### AC-9: OCR Configuration
- Users can configure their OCR endpoint
- Users can set the OCR URL, API key, and model
- The configuration is saved and used for all OCR requests
- Example: User sets OCR URL to "https://api.openai.com/v1", key to "sk-...", model to "gpt-4-vision-preview"

### AC-10: Data Persistence
- User data is stored locally in the browser
- Data persists between sessions
- Users can export/import their data

## Modules

### src/ocr.js
- `extractNutritionalData(imageData, ocrConfig)`: Extracts nutritional information from an image using OCR
  - Parameters: `imageData` (base64 encoded image), `ocrConfig` (object with url, key, model)
  - Returns: Promise resolving to nutritional data object
  - Example: Input: base64 image of nutrition label, Output: { energyKj: 2292, energyKcal: 549, fat: 33, saturatedFat: 13, carbohydrates: 55, sugars: 45, protein: 6.8, salt: 0.18 }

### src/food.js
- `createFood(name, nutritionalValues)`: Creates a new food entry
  - Parameters: `name` (string), `nutritionalValues` (object with values per 100g)
  - Returns: Food object with id
  - Example: Input: "Apple", { energyKj: 218, energyKcal: 52, fat: 0.2, saturatedFat: 0, carbohydrates: 13.8, sugars: 10.4, protein: 0.3, salt: 0.01 }, Output: { id: "food-1", name: "Apple", nutritionalValues: { energyKj: 218, energyKcal: 52, fat: 0.2, saturatedFat: 0, carbohydrates: 13.8, sugars: 10.4, protein: 0.3, salt: 0.01 } }

- `calculateNutritionalValues(food, amountGrams)`: Calculates nutritional values for a given amount
  - Parameters: `food` (food object), `amountGrams` (number)
  - Returns: Nutritional values for the specified amount
  - Example: Input: food object with energyKcal: 52 per 100g, amountGrams: 150, Output: { energyKj: 327, energyKcal: 78, fat: 0.3, saturatedFat: 0, carbohydrates: 20.7, sugars: 15.6, protein: 0.45, salt: 0.015 }

### src/meal.js
- `createMeal(name, foods)`: Creates a new meal with food items
  - Parameters: `name` (string), `foods` (array of { foodId, amountGrams })
  - Returns: Meal object with id and calculated totals
  - Example: Input: "Breakfast", [{ foodId: "food-1", amountGrams: 150 }], Output: { id: "meal-1", name: "Breakfast", foods: [{ foodId: "food-1", amountGrams: 150 }], totalNutritionalValues: { energyKj: 327, energyKcal: 78, fat: 0.3, saturatedFat: 0, carbohydrates: 20.7, sugars: 15.6, protein: 0.45, salt: 0.015 } }

### src/storage.js
- `saveData(data, storage)`: Saves data to the provided storage object
  - Parameters: `data` (object with foods, meals, preferences), `storage` (localStorage-like object)
  - Returns: void
  - Example: Input: { foods: [...], meals: [...] }, storage: localStorage, Output: data saved to localStorage

- `loadData(storage)`: Loads data from the provided storage object
  - Parameters: `storage` (localStorage-like object)
  - Returns: Object with foods, meals, preferences
  - Example: Input: localStorage, Output: { foods: [...], meals: [...], preferences: { trackedNutrients: ["energyKcal", "fat"] } }

## Stack

- **Runtime**: Node 24 with ES modules
- **Testing**: Node's built-in test runner (`node --test`)
- **UI**: Static web page in `public/`
- **OCR**: OpenAI-compatible endpoint (configured by user in the UI)
- **Storage**: localStorage (browser) or passed storage object (tests)

## Files

- `docs/SPEC.md`: This specification document
- `src/ocr.js`: OCR processing module
- `src/food.js`: Food database module
- `src/meal.js`: Meal planning module
- `src/storage.js`: Data persistence module
- `public/index.html`: Main web page
- `public/style.css`: Styling for the web page
- `public/app.js`: Frontend JavaScript
- `tests/ocr.test.js`: Tests for OCR module
- `tests/food.test.js`: Tests for food module
- `tests/meal.test.js`: Tests for meal module
- `tests/storage.test.js`: Tests for storage module