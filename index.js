const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce");

const Product = mongoose.model("Product", new mongoose.Schema({
  name: String,
  category: String,
  imageUrl: String,
}));

const Review = mongoose.model("Review", new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  content: String,
  sentiment: String,
}));

// Routes
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post("/products", async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.json(newProduct);
});

app.post("/reviews", async (req, res) => {
  const newReview = new Review(req.body);
  await newReview.save();
  res.json(newReview);
});

app.get("/reviews/:productId", async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId });
  res.json(reviews);
});

// 🔁 Proxy đến Hugging Face API
app.post("/analyze-review", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
      {
        inputs: req.body.review, // ✅ chính xác định dạng
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("🔥 Hugging Face error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
