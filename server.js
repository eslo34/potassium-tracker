require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Use dynamic port

app.use(cors());
app.use(bodyParser.json());

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// 🔹 API Key (Stored in Render environment variables)
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// 🔹 Function to search Perplexity AI for nutrition data
async function searchPerplexity(foodQuery) {
    try {
        console.log(`🔍 Searching Perplexity AI for: ${foodQuery}`);

        const response = await axios.post(
            "https://api.perplexity.ai/sonar/search",
            {
                query: `How much potassium and sodium does ${foodQuery} contain?`,
                num_results: 3, // Get top 3 results
                search_type: "precision"
            },
            {
                headers: {
                    "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("🟢 Perplexity Response:", JSON.stringify(response.data, null, 2));

        if (!response.data || !response.data.results || response.data.results.length === 0) {
            return { food: foodQuery, potassium: "Not found", sodium: "Not found" };
        }

        // Extract relevant text from the top Perplexity result
        const firstResult = response.data.results[0].text;

        // Try to extract numeric potassium and sodium values using regex
        const potassiumMatch = firstResult.match(/(\d+)\s?mg potassium/i);
        const sodiumMatch = firstResult.match(/(\d+)\s?mg sodium/i);

        return {
            food: foodQuery,
            potassium: potassiumMatch ? `${potassiumMatch[1]} mg` : "Not found",
            sodium: sodiumMatch ? `${sodiumMatch[1]} mg` : "Not found",
            fullResponse: firstResult // Full response from Perplexity
        };

    } catch (error) {
        console.error("❌ Perplexity API error:", error.message);
        return { food: foodQuery, potassium: "Error", sodium: "Error" };
    }
}

// 🔹 API Route to Analyze Food
app.post("/analyze-food", async (req, res) => {
    const foodQuery = req.body.food;
    const nutritionData = await searchPerplexity(foodQuery);
    res.json(nutritionData);
});

// 🔹 Serve `index.html` for any unknown route
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
