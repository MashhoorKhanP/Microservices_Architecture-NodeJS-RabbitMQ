import express from 'express';
import ProductModel from '../models/Product.js';
import amqp from 'amqplib';

const router = express.Router();
let connection, channel;

(async () => {
  try {
    const amqpServer = 'amqp://rabbitmq-srv';
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
