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
        // Ask ChatGPT for a natural language response that includes JSON at the end
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a nutrition expert. Given a food and weight, provide a clear explanation of its potassium and sodium content. At the end of your explanation, include a JSON object with the same values in this format: {\"potassium\": 422, \"sodium\": 1}. Ensure the JSON values match your explanation exactly." },
                { role: "user", content: `How much potassium and sodium is in ${userInput}?` }
            ]
        });

        const aiResponse = response.choices[0].message.content.trim();
        let potassium = 0;
        let sodium = 0;
        let jsonData = "{}";

        // Extract JSON from the response
        try {
            const jsonMatch = aiResponse.match(/\{.*?\}/s);
            if (jsonMatch) {
                jsonData = jsonMatch[0]; // Extract only the JSON block
                const parsedResponse = JSON.parse(jsonData);
                potassium = parsedResponse.potassium || 0;
                sodium = parsedResponse.sodium || 0;
            }
        } catch (error) {
            console.error("Error parsing JSON from ChatGPT:", error);
        }

        // Send both the natural language explanation and the extracted JSON data
        res.json({
            potassium,
            sodium,
            fullResponse: aiResponse, // Full text response from ChatGPT
            jsonData // Extracted JSON
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch nutrition data." });
    }
});
