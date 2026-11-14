const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND = "https://b-676boy.github.io";

app.use(cors({
  origin: [FRONTEND],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "20mb" }));

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    name: "BRIANIAC AI",
    status: "Backend is running"
  });
});

// CHAT - GROQ
app.post("/.netlify/functions/chat", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Chat API key is missing" });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: req.body.messages,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "Chat service failed" });
  }
});

// VISION - GEMMA 4
app.post("/.netlify/functions/vision", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Vision API key is missing" });
    }

    const { image, prompt } = req.body;

    if (!image || !image.startsWith("data:")) {
      return res.status(400).json({ error: "A valid image is required" });
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
      return res.status(400).json({ error: "Unsupported image format" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              {
                inline_data: {
                  mime_type: match[1],
                  data: match[2]
                }
              },
              {
                text: prompt || "Describe this image in detail."
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Vision API error:", data);
      return res.status(response.status).json({
        error: "Image understanding failed"
      });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("") || "I couldn't understand this image.";

    res.json({
      answer,
      description: answer
    });

  } catch (error) {
    console.error("Vision error:", error.message);
    res.status(500).json({ error: "Vision service failed" });
  }
});

// WEB SEARCH - TAVILY
app.post("/.netlify/functions/search", async (req, res) => {
  try {
    if (!process.env.TAVILY_API_KEY) {
      return res.status(500).json({ error: "Search API key is missing" });
    }

    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        include_answer: true
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ error: "Search service failed" });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`BRIANIAC AI backend running on port ${PORT}`);
});
Add BRIANIAC AI backend server
