const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
var cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.local || 5000;

// middleWare
app.use(
  cors({
    origin: [`http://localhost:5173`],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// create middleWare
const logger = (req, res, next) => {
  console.log("called", req.host, req.originalUrl);
  next();
};
// create verify token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log("token", token);
  if (!token) {
    return res.status(403).send({ massage: "unAuthorize" });
  }
  jwt.verify(token, process.env.ACESS_TOKEN, (err, decode) => {
    if (err) {
      return res.status(403).send({ massage: "unAuthorize" });
    }
    console.log("decoded ", decode);
    req.use = decode;

    next();
  });
};
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

    // access token generate
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACESS_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
        })
        .send({ success: true });
    });

    app.get("/house", logger, async (req, res) => {
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
        projection: { _id: 0, name: 1, place: 1, email: 1, price: 1, img: 1 },
      };

      const result = await Housecollection.findOne(query, options);
      res.send(result);
    });

    // one single booking

    app.get("/booking", logger, verifyToken, async (req, res) => {
      if (req.query.email !== req.use.email) {
        return res.status(403).send({ massage: "forbidden access" });
      }
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

    // patch
    app.patch("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateBooking = req.body;
      const updateDoc = {
        $set: {
          status: updateBooking.status,
        },
      };
      const result = await Bookingcollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // deleted booking
    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Bookingcollection.deleteOne(query);
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
