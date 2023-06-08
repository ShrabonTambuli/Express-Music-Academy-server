const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER
}:${process.env.DB_PASS}@cluster0.ezafyme.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const classCollection = client.db('expressMusicAcademy').collection('popularClasses');
const instructorCollection = client.db('expressMusicAcademy').collection('popularInstructors');


app.get('/class', async (req, res) => {
    const cursor = classCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  })

app.get('/instructors', async (req, res) => {
    const cursor = instructorCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  })









async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Express Music Academy Server is updating......!!')
  })
  
  app.listen(port, () => {
    console.log(`Express Music Academy Server is running port:${port}`)
  })