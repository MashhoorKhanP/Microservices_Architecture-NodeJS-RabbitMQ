# Microservices Architecture with Node.js and RabbitMQ

This repository contains a simple microservices architecture built using Node.js and RabbitMQ. The architecture consists of two services: `order-service` and `product-service`, which communicate with each other via RabbitMQ messaging queue.

## Getting Started

To run the application, follow these steps:

1. Clone this repository: 
  `git clone https://github.com/MashhoorKhanP/Blog_App-MicroServices_Architecture.git`

2. Navigate to the project directory: 
  `cd microservices-nodejs-rabbitmq`

3. Run the following command to start the application using Skaffold:
  `skaffold dev`

This command will build and deploy the services defined in the `skaffold.yaml` file.

## Services

1. **order-service**: Handles order-related operations. It listens for incoming messages from the `order-service-queue`, processes the orders, and sends them to the `product-service` for further processing.

2. **product-service**: Manages product-related operations. It receives orders from the `order-service`, updates product quantities, and performs other product-related tasks.

## Communication

The services communicate with each other using RabbitMQ messaging queue. The `order-service` sends order requests to the `product-service` via the `order-service-queue`, and the `product-service` processes these requests and sends responses back.