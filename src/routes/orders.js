const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create order
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { user_id, items, shipping_address_id = null, billing_address_id = null, currency = 'USD' } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    let total = 0;
    for (const it of items) {
      const [prodRows] = await conn.execute('SELECT id, price FROM products WHERE id = ?', [it.product_id]);
      if (!prodRows.length) throw new Error(`Product ${it.product_id} not found`);
      const price = Number(prodRows[0].price);
      total += price * Number(it.quantity);
    }

    // Insert order
    const [orderRes] = await conn.execute(
      `INSERT INTO orders (user_id, status, total, currency, shipping_address_id, billing_address_id)
       VALUES (?, 'pending', ?, ?, ?, ?)`,
      [user_id, total.toFixed(2), currency, shipping_address_id, billing_address_id]
    );
    const orderId = orderRes.insertId;

    // Insert items
    for (const it of items) {
      const [prodRows] = await conn.execute('SELECT id, price FROM products WHERE id = ?', [it.product_id]);
      const unitPrice = Number(prodRows[0].price);
      const subtotal = (unitPrice * Number(it.quantity)).toFixed(2);
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, it.product_id, it.quantity, unitPrice, subtotal]
      );

      await conn.execute(
        `UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND quantity >= ?`,
        [it.quantity, it.product_id, it.quantity]
      );
    }

    await conn.commit();

    // Return created order with items
    const [orderRows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    const [itemsRows] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    res.status(201).json({ order: orderRows[0], items: itemsRows });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id;
    let rows;
    if (userId) {
      [rows] = await pool.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    } else {
      [rows] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC');
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single order with items
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ order: orders[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
