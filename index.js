const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.local || 5000;

// middleWare
app.use(cors());
app.use(express.json());

// connect to mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.S3_BUCKET}:${process.env.SECRET_KEY}@cluster0.qlha3qo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const Housecollection = client.db("HouseRant").collection("house");
    const Bookingcollection = client.db("HouseRant").collection("book");

    app.get("/house", async (req, res) => {
      const cursor = Housecollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get item
    app.get("/house/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const options = {
        // Sort matched documents in descending order by rating

        // Include only the `title` and `imdb` fields in the returned document
        projection: { _id: 0, name: 1, email: 1, price: 1, img: 1 },
      };

      const result = await Housecollection.findOne(query, options);
      res.send(result);
    });

    // one single booking

    app.get("/booking", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const cursor = Bookingcollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // booking
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = await Bookingcollection.insertOne(booking);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("the server is running on ");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
