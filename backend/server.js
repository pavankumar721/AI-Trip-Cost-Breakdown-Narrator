require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

app.get("/", (req, res) => {
  res.send("AI Trip Cost Breakdown Narrator Backend Running");
});

app.post("/generate", async (req, res) => {
  try {
    const { customer, destination, amount } = req.body;

    if (!customer || !destination || !amount) {
      return res.status(400).json({
        error: "customer, destination and amount are required",
      });
    }

    const prompt = `
# Prompt V1

## System Instruction

You are an AI-powered Travel Cost Breakdown Narrator for Manivtha Tours & Travels.

Your responsibility is to explain trip package costs in a professional, engaging, and customer-friendly manner.

Requirements:

* Greet the customer by name.
* Explain transportation costs.
* Explain accommodation costs.
* Explain meal costs.
* Explain sightseeing costs.
* Explain taxes and service charges.
* Highlight the value provided.
* Use simple and clear language.
* Keep the explanation between 150 and 250 words.
* Maintain a positive and professional tone.

## User Template

Customer Name: {customer}

Destination: {destination}

Trip Cost: ₹{amount}

Generate a customer-friendly narration explaining the package cost.


`;


    const completion = await client.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const narration = completion.choices[0].message.content;

    res.json({
      success: true,
      narration,
    });
  } catch (error) {
    console.error("OPENROUTER ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});