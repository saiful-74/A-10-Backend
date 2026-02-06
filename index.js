const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// ---------------- Middleware ----------------
const allowedOrigins = [
  process.env.CLIENT_URL, // Later add Netlify URL here
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

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected!");

    const db = client.db("plateShareDB");

    // Collections
    const foodCollection = db.collection("foods");
    const requestsCollection = db.collection("requests");

    // ---------------- FOOD APIs ----------------

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

    // My foods (donator)
    app.get("/my-foods", async (req, res) => {
      const email = req.query.email;
      const foods = await foodCollection
        .find({ donator_email: email })
        .toArray();
      res.send(foods);
    });

    // ---------------- REQUEST SYSTEM ----------------

    // POST /requests (submit request)
    app.post("/requests", async (req, res) => {
      try {
        const requestData = req.body;
        requestData.status = "pending";
        requestData.createdAt = new Date();

        const result = await requestsCollection.insertOne(requestData);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // GET /requests/food/:foodId (requests for a food)
    app.get("/requests/food/:foodId", async (req, res) => {
      try {
        const { foodId } = req.params;
        const result = await requestsCollection.find({ foodId }).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // GET /requests?email=user@gmail.com  (my requests by requesterEmail)
    app.get("/requests", async (req, res) => {
      try {
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

    // PATCH /requests/:id (accept / reject)
    app.patch("/requests/:id", async (req, res) => {
      try {
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

    // PATCH /foods/status/:id (mark food as donated)
    app.patch("/foods/status/:id", async (req, res) => {
      try {
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
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

// ---------------- Root ----------------
app.get("/", (req, res) => {
  res.send("PlateShare API running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
