const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Express Music Academy Server is updating......!!')
  })
  
  app.listen(port, () => {
    console.log(`Express Music Academy Server is running port:${port}`)
  })