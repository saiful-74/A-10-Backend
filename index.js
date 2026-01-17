const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://curious-palmier-ba6203.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

// MongoDB URI (USING YOUR CREDENTIALS)
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.udjsjsk.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // optional connect
    // await client.connect();

    const db = client.db("plateShareDB");
    const foodCollection = db.collection("foods");
    const foodRequestsCollection = db.collection("foodRequests");

    // Add food
    app.post("/add-food", async (req, res) => {
      const food = req.body;
      food.food_status = "Available";
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });

    // Get all foods
    app.get("/foods", async (req, res) => {
      const status = req.query.status;
      let query = {};
      if (status) query.food_status = status;
      const foods = await foodCollection.find(query).toArray();
      res.send(foods);
    });

    // Get single food
    app.get("/foods/:id", async (req, res) => {
      const food = await foodCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(food);
    });

    // Update food
    app.put("/foods/:id", async (req, res) => {
      const result = await foodCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );
      res.send(result);
    });

    // Delete food
    app.delete("/foods/:id", async (req, res) => {
      const result = await foodCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // My foods
    app.get("/my-foods", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });

      const foods = await foodCollection
        .find({ donator_email: email })
        .toArray();
      res.send(foods);
    });

    // Food request
    app.post("/food-requests", async (req, res) => {
      const request = req.body;
      request.status = "pending";
      const result = await foodRequestsCollection.insertOne(request);
      res.send(result);
    });

    // Requests by food
    app.get("/food-requests/:foodId", async (req, res) => {
      const requests = await foodRequestsCollection
        .find({ foodId: req.params.foodId })
        .toArray();
      res.send(requests);
    });

    // Update request status
    app.put("/food-requests/:id", async (req, res) => {
      const result = await foodRequestsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: req.body.status } }
      );
      res.send(result);
    });

    console.log("MongoDB connected & APIs ready!");
  } catch (error) {
    console.error(error);
  }
}

run();

// Root
app.get("/", (req, res) => {
  res.send("PlateShare API running");
});

// Server start
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
