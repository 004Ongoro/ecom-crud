Create the database and schema:

Run the SQL file schemas.sql (the schema I created is available in this conversation as a document named Ecommerce Schema). Example:

``` mysql -u root -p < schemas.sql ```


Clone the repo (or create a new project folder), copy the code above into the structure shown.

Create .env with your DB credentials.

Install dependencies:

``` npm install ```


Start the app:

``` npm run dev ```


Or:

``` npm start ```


API base URL (by default): http://localhost:4000/api

API endpoints (summary)
Products

POST /api/products — Create a product.

Body: { "sku": "SKU-1003", "name":"USB Cable", "description":"", "price": 4.99 }

GET /api/products — List products.

GET /api/products/:id — Get product by id.

PUT /api/products/:id — Update product.

DELETE /api/products/:id — Delete product.

Orders

POST /api/orders — Create an order (items array required).

Body sample:

``` {
  "user_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ],
  "shipping_address_id": 1,
  "billing_address_id": 1,
  "currency": "USD"
} ```


GET /api/orders — List orders (optionally ?user_id=1).

GET /api/orders/:id — Get order with items.

PATCH /api/orders/:id/status — Update order status. Body: { "status": "shipped" }

DELETE /api/orders/:id — Delete order.