require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Use dynamic port for Render

app.use(cors());
app.use(bodyParser.json());

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
// 🔹 API Keys (Stored in Render environment variables)
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🔹 Function to scrape Google search results for food nutrition
async function scrapeGoogleNutrition(foodQuery) {
    try {
        const targetURL = `https://www.google.com/search?q=${encodeURIComponent(foodQuery + " potassium sodium nutrition")}`;

        const response = await axios.get("http://api.scraperapi.com", {
            params: {
                api_key: SCRAPER_API_KEY,
                url: targetURL
            }
        });

        if (!response.data) {
            return "No search results found.";
        }

        return response.data; // Return raw scraped HTML/text
    } catch (error) {
        console.error("Web scraping failed:", error);
        return "Error fetching nutrition data.";
    }
}

// 🔹 Function to process scraped data with ChatGPT
async function analyzeWithChatGPT(scrapedText, foodQuery) {
    try {
        const openai = require("openai");
        const client = new openai.OpenAI({ apiKey: OPENAI_API_KEY });

        const prompt = `
            You are a nutrition expert. Based on the following Google search results, summarize the potassium and sodium content of '${foodQuery}'.
            Then, at the end, return a JSON object in this format:
            {"potassium": 422, "sodium": 1}

            Search Results:
            ${scrapedText}
        `;

        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }]
        });

        const aiResponse = response.choices[0].message.content.trim();

        // Extract JSON from ChatGPT's response
        let jsonData = "{}";
        let potassium = 0;
        let sodium = 0;

        try {
            const jsonMatch = aiResponse.match(/\{.*?\}/s);
            if (jsonMatch) {
                jsonData = jsonMatch[0]; // Extract JSON block
                const parsedResponse = JSON.parse(jsonData);
                potassium = parsedResponse.potassium || 0;
                sodium = parsedResponse.sodium || 0;
            }
        } catch (error) {
            console.error("Error parsing JSON from ChatGPT:", error);
        }

        return {
            potassium,
            sodium,
            fullResponse: aiResponse, // Full natural language response
            jsonData // Extracted JSON
        };

    } catch (error) {
        console.error("Error processing with ChatGPT:", error);
        return { error: "Failed to process data with AI." };
    }
}

// 🔹 API Route to Analyze Food
app.post("/analyze-food", async (req, res) => {
    const foodQuery = req.body.food;

    // Step 1: Scrape Google for potassium & sodium info
    const scrapedText = await scrapeGoogleNutrition(foodQuery);

    // Step 2: Process the scraped data with ChatGPT
    const result = await analyzeWithChatGPT(scrapedText, foodQuery);

    res.json(result);
});

// 🔹 Serve `index.html` for any unknown route
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
