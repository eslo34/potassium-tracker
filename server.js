require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const USDA_API_KEY = process.env.USDA_API_KEY; // Store this in your Render environment variables

// Function to search for food data
async function getFoodNutrition(foodQuery) {
    try {
        // Step 1: Search for the food item
        const searchResponse = await axios.get(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${foodQuery}&api_key=${USDA_API_KEY}`);
        
        if (!searchResponse.data.foods.length) {
            return { error: "Food not found in USDA database." };
        }

        // Get the first matching food
        const foodId = searchResponse.data.foods[0].fdcId;

        // Step 2: Get detailed nutrition data
        const foodDetails = await axios.get(`https://api.nal.usda.gov/fdc/v1/food/${foodId}?api_key=${USDA_API_KEY}`);
        const nutrients = foodDetails.data.foodNutrients;

        // Extract potassium and sodium values
        let potassium = 0;
        let sodium = 0;

        nutrients.forEach(nutrient => {
            if (nutrient.nutrientId === 306) { // 306 = Potassium
                potassium = nutrient.amount;
            }
            if (nutrient.nutrientId === 307) { // 307 = Sodium
                sodium = nutrient.amount;
            }
        });

        return {
            food: foodDetails.data.description,
            potassium: Math.round(potassium), // Convert to mg
            sodium: Math.round(sodium) // Convert to mg
        };
    } catch (error) {
        console.error("Error fetching nutrition data:", error);
        return { error: "Failed to fetch nutrition data." };
    }
}

// API Route to Handle Food Requests
app.post("/analyze-food", async (req, res) => {
    const foodQuery = req.body.food;
    const nutritionData = await getFoodNutrition(foodQuery);
    res.json(nutritionData);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
