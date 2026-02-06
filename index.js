const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

// ---------------- Middleware ----------------
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5176",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// ---------------- MongoDB ----------------
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let foodCollection;
let requestsCollection;

async function connectDB() {
  if (!foodCollection || !requestsCollection) {
    await client.connect();
    const db = client.db("plateShareDB");
    foodCollection = db.collection("foods");
    requestsCollection = db.collection("requests");
    console.log("MongoDB Connected");
  }
}

// ---------------- Root ----------------
app.get("/", async (req, res) => {
  res.send("PlateShare API running");
});

// ---------------- FOOD APIs ----------------
app.post("/add-food", async (req, res) => {
  await connectDB();
  const food = req.body;
  food.food_status = "Available";
  const result = await foodCollection.insertOne(food);
  res.send(result);
});

app.get("/foods", async (req, res) => {
  await connectDB();
  const status = req.query.status;
  const query = status ? { food_status: status } : {};
  const foods = await foodCollection.find(query).toArray();
  res.send(foods);
});

app.get("/foods/:id", async (req, res) => {
  await connectDB();
  const food = await foodCollection.findOne({
    _id: new ObjectId(req.params.id),
  });
  res.send(food);
});

app.put("/foods/:id", async (req, res) => {
  await connectDB();
  const result = await foodCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.send(result);
});

app.delete("/foods/:id", async (req, res) => {
  await connectDB();
  const result = await foodCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });
  res.send(result);
});

app.get("/my-foods", async (req, res) => {
  await connectDB();
  const email = req.query.email;
  const foods = await foodCollection
    .find({ donator_email: email })
    .toArray();
  res.send(foods);
});

// ---------------- REQUEST APIs ----------------
app.post("/requests", async (req, res) => {
  try {
    await connectDB();
    const requestData = req.body;
    requestData.status = "pending";
    requestData.createdAt = new Date();

    const result = await requestsCollection.insertOne(requestData);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/requests/food/:foodId", async (req, res) => {
  try {
    await connectDB();
    const { foodId } = req.params;
    const result = await requestsCollection.find({ foodId }).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/requests", async (req, res) => {
  try {
    await connectDB();
    const email = req.query.email;
    if (!email)
      return res.status(400).send({ error: "email query is required" });

    const result = await requestsCollection
      .find({ requesterEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.patch("/requests/:id", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { status } = req.body;

    const result = await requestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.patch("/foods/status/:id", async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const result = await foodCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { food_status: "donated" } }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ❌ app.listen থাকবে না
module.exports = app;
