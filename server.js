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
                model: "sonar-pro",
                messages: [
                    {
                        role: "system",
                        content: "You are a nutrition assistant. Provide potassium and sodium content for food items in milligrams. Make sure to list all the sources which you went through. For each source list the potassium and sodium levels you found on that particular source. Your answer should look EXACTLY like this. Under NO CURCOMSTANCES should there be en extra ':' or anything like that. YOU HAVE TO FOLLOW THIS EXACT STRUCTURE. Here is the structure you have to follow: 'The potassium and sodium levels for _ grams of _ is Potassium _ and Sodium _. (new paragraph. Like when you press enter in word) Source 1 is _(example USDA).' Then continue on with listing your sources in that order. ONLY use the source USDA. NO OTHER SOURCES ARE ALLOWED besides USDA. The web URL of the source you're taking information from should look something like this 'https://fdc.nal.usda.gov/food-details/170026/nutrients'"
                    },
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

        console.log("📝 Extracted Text from Perplexity:", resultText);

        // ✅ Updated Regex to extract potassium and sodium correctly
        const match = resultText.match(/Potassium\s(\d+).*?Sodium\s(\d+)/i);

        const potassium = match ? `${match[1]} mg` : "Not found";
        const sodium = match ? `${match[2]} mg` : "Not found";

        console.log(`✅ Extracted Values - Potassium: ${potassium}, Sodium: ${sodium}`);

        return {
            food: foodQuery,
            potassium,
            sodium,
            fullResponse: resultText
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
