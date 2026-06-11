require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

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

app.post("/api/generate", async (req, res) => {
  try {
    const { customer, destination, amount } = req.body;
    

    
    
    if (!customer) {
  return res.status(400).json({
    success: false,
    error: "Customer name is required",
  });
}

if (!destination) {
  return res.status(400).json({
    success: false,
    error: "Destination is required",
  });
}

if (amount === undefined || amount === null || amount === "") {
  return res.status(400).json({
    success: false,
    error: "Amount is required",
  });

   

}
const tripAmount = Number(amount);

if (isNaN(tripAmount) || tripAmount <= 0) {
  return res.status(400).json({
    success: false,
    error: "Amount must be a positive number",
  });


}
const transportation = Math.round(tripAmount * 0.30);
const accommodation = Math.round(tripAmount * 0.35);
const meals = Math.round(tripAmount * 0.15);
const sightseeing = Math.round(tripAmount * 0.10);

const taxes =
  tripAmount -
  (
    transportation +
    accommodation +
    meals +
    sightseeing
  );

    const prompt = `
# Prompt V4

Role:
You are a professional Travel Cost Breakdown Narrator for Manivtha Tours & Travels.

Objective:
Generate a personalized and customer-friendly explanation of a travel package cost.

Customer Details:
Customer Name: ${customer}
Destination: ${destination}
Total Package Cost: ₹${tripAmount}

Verified Cost Breakdown:
Transportation: ₹${transportation}
Accommodation: ₹${accommodation}
Meals: ₹${meals}
Sightseeing & Activities: ₹${sightseeing}
Taxes & Service Charges: ₹${taxes}

Rules:

1. Use the provided breakdown exactly.
2. Do not modify any amounts.
3. Do not perform calculations.
4. Mention the destination naturally.
5. Keep the narration professional and easy to understand.
6. Avoid repetitive phrases.
7. Highlight customer value.
8. End with a positive closing statement.
9. Mention one attractive feature of the destination.
10. Use unique closing wording.
11. Sound like an experienced travel consultant.
12. Make package value summary persuasive.
13. Keep narration engaging and customer-focused.

Output Format:

Greeting

Trip Cost Breakdown

Explanation of Each Component

Package Value Summary

Closing Message

`;

const startTime = Date.now();
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
    const endTime = Date.now();

const responseTimeMs = endTime - startTime;

    const narration = completion.choices[0].message.content;
    
    const historyFile = "history.json";

let history = [];

if (fs.existsSync(historyFile)) {
  history = JSON.parse(
    fs.readFileSync(historyFile, "utf8")
  );
}

const record = {
  id: Date.now(),
  customer,
  destination,
  amount: tripAmount,
  promptVersion: "V4",
  response: narration,
  timestamp: new Date().toISOString(),
  response_time_ms: responseTimeMs
};

history.unshift(record);

fs.writeFileSync(
  historyFile,
  JSON.stringify(history, null, 2)
);


if (!narration) {
  return res.status(500).json({
    success: false,
    error: "AI returned an empty response",
  });
}

    res.json({
  success: true,
  narration,
  response_time_ms: responseTimeMs
});
  } catch (error) {
  console.error("OPENROUTER ERROR:", error);

  if (error.status === 401) {
    return res.status(401).json({
      success: false,
      error: "Invalid API Key",
    });
  }

  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded. Please try again later.",
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
}
});
app.get("/api/history", (req, res) => {

  const historyFile = "history.json";

  if (!fs.existsSync(historyFile)) {
    return res.json([]);
  }

  const history = JSON.parse(
    fs.readFileSync(historyFile, "utf8")
  );

  res.json(history);

});

app.get("/api/history/:id", (req, res) => {

  const historyFile = "history.json";

  if (!fs.existsSync(historyFile)) {
    return res.status(404).json({
      error: "No history found"
    });
  }

  const history = JSON.parse(
    fs.readFileSync(historyFile, "utf8")
  );

  const record = history.find(
    item => item.id == req.params.id
  );

  if (!record) {
    return res.status(404).json({
      error: "Record not found"
    });
  }

  res.json(record);

});

app.post("/api/feedback", (req, res) => {
  try {
    const { generation_id, rating, comment } = req.body;

    if (!generation_id) {
      return res.status(400).json({
        success: false,
        error: "generation_id is required",
      });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        error: "rating is required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "rating must be between 1 and 5",
      });
    }

    const feedbackPath = path.join(__dirname, "feedback.json");

    let feedback = [];

    if (fs.existsSync(feedbackPath)) {
      feedback = JSON.parse(
        fs.readFileSync(feedbackPath, "utf8")
      );
    }

    const newFeedback = {
      id: Date.now(),
      generation_id,
      rating,
      comment: comment || "",
      timestamp: new Date().toISOString(),
    };

    feedback.push(newFeedback);

    fs.writeFileSync(
      feedbackPath,
      JSON.stringify(feedback, null, 2)
    );

    res.json({
      success: true,
      message: "Feedback saved successfully",
      feedback: newFeedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.get("/api/analytics/quality", (req, res) => {
  try {
    const feedbackPath = path.join(__dirname, "feedback.json");

    if (!fs.existsSync(feedbackPath)) {
      return res.json({
        totalFeedback: 0,
        averageRating: 0,
      });
    }

    const feedback = JSON.parse(
      fs.readFileSync(feedbackPath, "utf8")
    );

    const totalFeedback = feedback.length;

    const averageRating =
      totalFeedback > 0
        ? (
            feedback.reduce(
              (sum, item) => sum + item.rating,
              0
            ) / totalFeedback
          ).toFixed(2)
        : 0;

    res.json({
      totalFeedback,
      averageRating,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.get("/api/admin/analytics", (req, res) => {
  try {
    const historyPath = path.join(__dirname, "history.json");
    const feedbackPath = path.join(__dirname, "feedback.json");

    const history = fs.existsSync(historyPath)
      ? JSON.parse(fs.readFileSync(historyPath, "utf8"))
      : [];

    const feedback = fs.existsSync(feedbackPath)
      ? JSON.parse(fs.readFileSync(feedbackPath, "utf8"))
      : [];

    const totalGenerations = history.length;

    const totalFeedback = feedback.length;

    const averageRating =
      totalFeedback > 0
        ? (
            feedback.reduce((sum, item) => sum + item.rating, 0) /
            totalFeedback
          ).toFixed(2)
        : 0;

    const destinationCounts = {};

    history.forEach((item) => {
      destinationCounts[item.destination] =
        (destinationCounts[item.destination] || 0) + 1;
    });

    const topInputs = Object.entries(destinationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.json({
      totalGenerations,
      totalFeedback,
      averageRating,
      topInputs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.get("/api/templates", (req, res) => {
  try {
    const templatesPath = path.join(__dirname, "templates.json");

    const templates = JSON.parse(
      fs.readFileSync(templatesPath, "utf8")
    );

    res.json(templates);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.post("/api/templates", (req, res) => {
  try {
    const { name, customer, destination, amount } = req.body;

    if (!name || !customer || !destination || !amount) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    const templatesPath = path.join(__dirname, "templates.json");

    const templates = JSON.parse(
      fs.readFileSync(templatesPath, "utf8")
    );

    const newTemplate = {
      id: Date.now(),
      name,
      customer,
      destination,
      amount,
    };

    templates.push(newTemplate);

    fs.writeFileSync(
      templatesPath,
      JSON.stringify(templates, null, 2)
    );

    res.json({
      success: true,
      template: newTemplate,
    });
  } catch (error) {
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