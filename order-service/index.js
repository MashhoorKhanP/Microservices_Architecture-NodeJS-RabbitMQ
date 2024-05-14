import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import amqp from 'amqplib';
import OrderModel from './models/Order.js';

const app = express();
const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }

})();

const createOrder = async (products) => {
  try {
    let total = 0;
    products.forEach((product) => {
      total += product.price;
    })
    const order = new OrderModel({
      products,
      total
    });
    await order.save();
  } catch (error) {
    console.log(error);
  }
}

let connection, channel;
(async () => {
  const amqpServer = 'amqp://rabbitmq-service';
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue('order-service-queue', { durable: true });
})().then(() => {
  channel.consume('order-service-queue', (data) => {
    try {
      const messageContent = JSON.parse(data.content.toString()); // Parse the Buffer content to JSON
      const { products } = messageContent; // Extract products from the parsed content

      console.log("🚀 ~ channel.consume ~ products:", products);
      const newOrder = createOrder(products);

      channel.ack(data);
      channel.sendToQueue('product-service-queue', Buffer.from(JSON.stringify(newOrder)));
    } catch (error) {
      console.error('Error processing message:', error);
      channel.reject(data, false); // Reject the message
    }
  });
});

app.listen(PORT, () => {
  console.log("Order service running on ports ", PORT);
})