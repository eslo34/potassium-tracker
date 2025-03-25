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
                        content: "You are a nutrition assistant and MUST ONLY use the USDA database. DO NOT use any other sources, blogs, or general nutrition websites. ONLY IF USDA DATA IS NOT AVALIABLE MAY YOU USE OTHER SOURCES. The response format should be EXACTLY like this. NO EXTRA ':' or anything like that it should be EXACTLY like this:'According to (list here of sources used) the potassium and sodium levels for _ grams of _ is Potassium _ mg and Sodium _ mg.' Answer with that exact format."
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
            return { food: foodQuery, potassium: "Not found", sodium: "Not found"};
        }

        const resultText = response.data.choices[0].message.content;

        console.log("📝 Extracted Text from Perplexity:", resultText);

        // ✅ Extract values only from the official statement
        const match = resultText.match(/Potassium\s(\d+)\s*mg.*?Sodium\s(\d+)\s*mg/i);

        const potassium = match ? parseInt(match[1]) : 0;
        const sodium = match ? parseInt(match[2]) : 0;



        console.log(`✅ Extracted Values - Potassium: ${potassium}, Sodium: ${sodium}`);

        return {
            food: foodQuery,
            potassium,
            sodium,
            fullResponse: resultText
        };

    } catch (error) {
        console.error("❌ Perplexity API error:", error.response?.data || error.message);
        return { food: foodQuery, potassium: "Error", sodium: "Error"};
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
