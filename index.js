const express = require('express');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

//middleware

// app.use(cors());
app.use(
  cors({
    origin: "*",
    methods: "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  }))

app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }

  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}




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

async function run() {
  try {
    const classCollection = client.db('expressMusicAcademy').collection('popularClasses');
    const instructorCollection = client.db('expressMusicAcademy').collection('popularInstructors');
    const classesCollection = client.db('expressMusicAcademy').collection('classes');
    const selectedCollection = client.db('expressMusicAcademy').collection('selected');
    const usersCollection = client.db('expressMusicAcademy').collection('users');
    const paymentsCollection = client.db('expressMusicAcademy').collection('payments');




    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })

      res.send({ token })
    })


    // verifyAmin

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }



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



    app.get('/classes', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    })


    app.get('/payment', async (req, res) => {
      const result = await paymentsCollection.find().toArray();
      res.send(result);
    })


    app.get('/selected', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email };
      const result = await selectedCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/selected/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await selectedCollection.findOne(query)
      res.send(result);
    })

    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // admin

    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.put('/classes/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateStatus = {
        $set: {
          status: "Approve"
        }
      }

      const result = await classesCollection.updateOne(query, updateStatus)
      res.json(result)
    })

    app.put('/classesFeedback/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const update = req.body;
      const classFd = {
        $set: {
          feedback: update.feedback
        }
      }
      const result = await classesCollection.updateOne(filter, classFd, options)
      res.send(result);
    })

    //instructor

    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instructor: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      res.send(result);
    })

    app.get('/myClasses', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })


    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.post('/selected', async (req, res) => {
      const p = req.body;
      const result = await selectedCollection.insertOne(p);
      res.send(result);
    })


    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already existing' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.post('/classes', async (req, res) => {
      const addProduct = req.body;
      const result = await classesCollection.insertOne(addProduct);
      res.send(result);
    })

    app.delete('/selected/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedCollection.deleteOne(query);
      res.send(result);
    })

    // create payment

    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']

      });
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    app.post('/payments/:id', async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentsCollection.insertOne(payment);
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteResult = await selectedCollection.deleteOne(query)

      res.send({ insertResult, deleteResult });
    })


    app.get('/payments', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email };
      const result = await paymentsCollection.find(query).toArray();
      res.send(result);
    })








    // Connect the client to the server	(optional starting in v4.7)
    //  client.connect();
    // Send a ping to confirm a successful connection
    // // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");




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