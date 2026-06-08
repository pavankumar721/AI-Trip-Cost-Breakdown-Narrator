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
Role:
You are an AI-powered Travel Cost Breakdown Narrator.

Input:
Customer Name: ${customer}
Destination: ${destination}
Trip Cost: ₹${amount}

Task:
Generate a detailed explanation of the trip package cost.

Instructions:
- Start by greeting the customer.
- Explain how transportation contributes to the cost.
- Explain accommodation charges.
- Explain meal and food arrangements.
- Explain sightseeing and tourism activities.
- Mention taxes, booking fees, and service charges.
- Highlight the value provided by the package.
- Maintain a professional and friendly tone.
- Keep the response concise and easy to understand.
- Output only the narration.

Expected Style:
Professional, informative, customer-centric.
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