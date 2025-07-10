const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await db.getProducts();
        res.json(products);
    } catch (error) {
        console.error('Products fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await db.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Product fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
