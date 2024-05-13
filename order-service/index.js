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
  let total = 0;
  products.forEach((product) => {
    total += product.price;
  })
  const order = new OrderModel({
    products,
    total
  });
  await order.save();
}

let connection, channel;
(async () => {
  const amqpServer = 'amqp://rabbitmq-srv';
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue('order-service-queue', { durable: true });
})().then(async () => {
  channel.consume('order-service-queue', async (data) => {
    const { products } = JSON.parse(data);
    const newOrder = await createOrder(products);
    channel.ack(data);
    channel.sendToQueue('product-service-queue', Buffer.from(JSON.stringify(newOrder)));
  });
});

app.listen(PORT, () => {
  console.log("Order service running on port ", PORT);
})