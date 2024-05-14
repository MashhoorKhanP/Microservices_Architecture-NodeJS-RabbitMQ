import express from 'express';
import ProductModel from '../models/Product.js';
import amqp from 'amqplib';

const router = express.Router();
let connection, channel;

(async () => {
  try {
    const amqpServer = 'amqp://rabbitmq-service';
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue('product-service-queue', { durable: true });
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
})();

// Add a product
router.post('/add-product', async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    if (!name || !price || !quantity) {
      return res.status(400).json({
        message: 'Please provide product details!'
      });
    }

    const product = new ProductModel({ name, price, quantity });
    await product.save();

    return res.status(201).json({
      message: 'Product created successfully!'
    });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
});

router.post('/order-product', async (req, res) => {
  try {
    if (!channel) {
      throw new Error("RabbitMQ channel is not initialized");
    }

    const { productIds } = req.body;
    const products = await ProductModel.find({ _id: { $in: productIds } });
    // Check if any product is out of stock
    const outOfStockProduct = products.find(product => product.quantity === 0);
    if (outOfStockProduct) {
      return res.status(400).json({
        message: `Product '${outOfStockProduct.name}' is out of stock`
      });
    }

    // Update the quantity of each product and save it to the database
    await Promise.all(products.map(async (product) => {
      if (product.quantity > 0) {
        product.quantity -= 1;
        await product.save();
      }
    }));
    
    await channel.sendToQueue('order-service-queue', Buffer.from(JSON.stringify({ products })));

    return res.status(201).json({
      message: 'Order placed successfully!',
      products
    });
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
});

export default router;
