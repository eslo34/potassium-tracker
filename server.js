require("dotenv").config();
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY); // Debugging line
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Route for the homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Store API key in .env file
});

app.post("/analyze-food", async (req, res) => {
    const userInput = req.body.food;

    try {
        // First request: Get JSON data
        const jsonResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a nutrition expert. Given a food and weight, return ONLY a JSON object with the potassium and sodium content in mg. No extra text, no explanation. Example format: {\"potassium\": 422, \"sodium\": 1}. Always ensure the JSON values are correct and match the food weight provided." },
                { role: "user", content: `How much potassium and sodium is in ${userInput}?` }
            ]
        });

        const jsonText = jsonResponse.choices[0].message.content.trim();
        let potassium = 0;
        let sodium = 0;
        let jsonData = "{}";

        // Extract and parse JSON
        try {
            jsonData = jsonText.match(/\{.*?\}/s)[0]; // Extract only the JSON block
            const parsedResponse = JSON.parse(jsonData);
            potassium = parsedResponse.potassium || 0;
            sodium = parsedResponse.sodium || 0;
        } catch (error) {
            console.error("Error parsing JSON from ChatGPT:", error);
            jsonData = "{}";
        }

        // Second request: Get natural language explanation
        const explanationResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a nutrition expert. Given a food and weight, provide a clear explanation of its potassium and sodium content. Ensure that the values in your explanation match exactly with the JSON values. Do NOT return a JSON object in this response." },
                { role: "user", content: `How much potassium and sodium is in ${userInput}? Explain it clearly.` }
            ]
        });

        const fullResponse = explanationResponse.choices[0].message.content.trim();

        res.json({
            potassium,
            sodium,
            fullResponse, // Send full ChatGPT explanation
            jsonData // Send structured JSON data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch nutrition data." });
    }
});
