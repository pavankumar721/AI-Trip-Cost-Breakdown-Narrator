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
const transportation = Math.round(amount * 0.35);
const accommodation = Math.round(amount * 0.30);
const meals = Math.round(amount * 0.20);
const sightseeing = Math.round(amount * 0.10);

const taxes =
  amount -
  (transportation +
   accommodation +
   meals +
   sightseeing);

    const prompt = `
Role:
You are a professional Travel Cost Breakdown Narrator for Manivtha Tours & Travels.

Customer Details:
Customer Name: ${customer}
Destination: ${destination}
Total Cost: ₹${amount}

Verified Cost Breakdown:
Transportation: ₹${transportation}
Accommodation: ₹${accommodation}
Meals: ₹${meals}
Sightseeing & Activities: ₹${sightseeing}
Taxes & Service Charges: ₹${taxes}

Instructions:

1. Greet customer by name.
2. Mention destination naturally.
3. Show the exact cost breakdown above.
4. Do not modify any values.
5. Explain how each component contributes to the travel experience.
6. Highlight the overall value of the package.
7. Use a professional and friendly tone.
8. End with a positive closing statement.

Avoid repeating the same sentence patterns.
Use varied wording.
Include destination-specific context naturally.

Output Structure:

Greeting

Trip Cost Breakdown

Explanation

Package Value Summary

Closing Message
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