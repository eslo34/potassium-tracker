rrequire("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

// API Route to Handle Food Requests
const USDA_API_KEY = process.env.USDA_API_KEY;

async function getFoodNutrition(foodQuery) {
    try {
        const searchResponse = await axios.get(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${foodQuery}&api_key=${USDA_API_KEY}`);

        if (!searchResponse.data.foods.length) {
            return { error: "Food not found in USDA database." };
        }

        const foodId = searchResponse.data.foods[0].fdcId;
        const foodDetails = await axios.get(`https://api.nal.usda.gov/fdc/v1/food/${foodId}?api_key=${USDA_API_KEY}`);
        const nutrients = foodDetails.data.foodNutrients;

        let potassium = 0;
        let sodium = 0;

        nutrients.forEach(nutrient => {
            if (nutrient.nutrientId === 306) {
                potassium = nutrient.amount;
            }
            if (nutrient.nutrientId === 307) {
                sodium = nutrient.amount;
            }
        });

        return {
            food: foodDetails.data.description,
            potassium: Math.round(potassium),
            sodium: Math.round(sodium),
        };
    } catch (error) {
        console.error("Error fetching nutrition data:", error);
        return { error: "Failed to fetch nutrition data." };
    }
}

app.post("/analyze-food", async (req, res) => {
    const foodQuery = req.body.food;
    const nutritionData = await getFoodNutrition(foodQuery);
    res.json(nutritionData);
});

// Serve index.html for all remaining routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
