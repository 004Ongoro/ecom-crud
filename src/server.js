const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.get('/', (req, res) => {
  res.send('E-commerce CRUD API — Products & Orders');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
