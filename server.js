require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function fetchNutritionData(foodQuery) {
    try {
        console.log(`🔍 Fetching data for: ${foodQuery}`);

        const response = await axios.post(
            "https://api.perplexity.ai/chat/completions",
            {
                model: "sonar-pro", // Ensure this model is accessible with your API key
                messages: [
                    { role: "system", content: "You are a nutrition assistant. Provide potassium and sodium content for food items in milligrams. Make sure to list all the sources which you went through. For each source list the potassium and sodium levels you found on that perticular source. Your answer should look like: 'The official potassium and sodium levels for _ grams of _ is Potassium _ and Sodium _. Source 1 is _(example USDA) that said _ mg of potassium and _ mg of sodium per 100g of _.' Then continue on with listing your sources in that order. After all sources are listed end with 'therefore my conclision is that the official potassium and sodium levels are Potassium _ and Sodium _'." },
                    { role: "user", content: `How much potassium and sodium does ${foodQuery} contain? Provide exact values in milligrams.` }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("🟢 Perplexity Response:", JSON.stringify(response.data, null, 2));

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            return { food: foodQuery, potassium: "Not found", sodium: "Not found" };
        }

        const resultText = response.data.choices[0].message.content;

        console.log("Extracted Text from Perplexity:", resultText);

        // ✅ Improved Regex Extraction
        const potassiumMatch = resultText.match(/(?:potassium:|contains)\s?(\d+)\s?mg/i);
        const sodiumMatch = resultText.match(/(?:sodium:|contains)\s?(\d+)\s?mg/i);

        const potassium = potassiumMatch ? `${potassiumMatch[1]} mg` : "Not found";
        const sodium = sodiumMatch ? `${sodiumMatch[1]} mg` : "Not found";

        return {
            food: foodQuery,
            potassium,
            sodium,
            fullResponse: resultText // ✅ Includes the full response for debugging
        };

    } catch (error) {
        console.error("❌ Perplexity API error:", error.response?.data || error.message);
        return { food: foodQuery, potassium: "Error", sodium: "Error" };
    }
}


app.post("/analyze-food", async (req, res) => {
    const foodQuery = req.body.food;
    const nutritionData = await fetchNutritionData(foodQuery);
    res.json(nutritionData);
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
