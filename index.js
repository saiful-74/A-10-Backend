const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5176"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Mongo URI from .env (one line solution)
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected!");

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

    // Get all foods (with status filter)
    app.get("/foods", async (req, res) => {
      const status = req.query.status;
      const query = status ? { food_status: status } : {};
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

  } catch (err) {
    console.error(err);
  }
}

run();

// Root
app.get("/", (req, res) => {
  res.send("PlateShare API running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
