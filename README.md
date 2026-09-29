# Nutrition Tracker

A free, ad-free nutrition tracker web application that allows you to:

- Take photos of nutrition labels from food products
- Use OCR with AI to extract nutritional information from the photos
- Store and track nutritional data for custom foods/meals
- Create meal plans by specifying grams of each food item
- Track custom metrics: calories, sodium, saturated fats, or any other nutrients

## Features

- **Photo-based label scanning**: Upload or capture photos of nutrition labels
- **AI-powered OCR**: Extracts nutritional data using OpenAI-compatible vision models
- **Custom food database**: Add your own foods with nutritional information
- **Meal planning**: Create meals by combining foods with custom gram amounts
- **Custom tracking**: Choose which nutrients you want to monitor
- **Responsive design**: Works on desktop and mobile devices
- **Free and ad-free**: No subscriptions, no ads, no tracking

## How to Run

### Prerequisites

- Node.js 24+
- A modern web browser

### Setup

```bash
npm install
```

### Running the Tests

```bash
npm test
```

### Running the App

Serve the `public/` directory with any static file server. For example:

```bash
npx serve public
```

Then open `http://localhost:3000` in your browser.

## How to Configure the AI Endpoint

The app uses an OpenAI-compatible API for OCR. Configure it in the app's Settings tab:

1. Open the app in your browser
2. Navigate to the **Settings** tab
3. Enter your AI endpoint details:
   - **API URL**: The base URL of your OpenAI-compatible endpoint (e.g., `https://api.openai.com/v1`)
   - **API Key**: Your API key for the service
   - **Model**: The model to use (e.g., `gpt-4o`, `gpt-4-vision-preview`)

The app will send the nutrition label image to this endpoint and parse the response to extract nutritional data.

## How to Test

Run the test suite with:

```bash
npm test
```

The tests cover:
- OCR parsing of nutrition tables
- Nutrition value scaling by grams
- Storage CRUD operations (foods, meals, preferences)
- Meal creation and nutrition aggregation

## What Is Not Done Yet

- **Real AI integration**: The OCR module is implemented but the actual AI API call needs to be wired up with user-provided credentials
- **Backend server**: The app currently runs entirely in the browser with localStorage
- **User authentication**: No login/signup system
- **Cloud sync**: Data is stored locally only
- **Export/Import**: No way to export or import data
- **Weekly/monthly summaries**: Only daily totals are shown
- **Barcode scanning**: No barcode support yet
- **Offline support**: No service worker for offline use