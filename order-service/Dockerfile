# Specify a base image
FROM node:22-alpine3.18

# Install some dependencies
WORKDIR /app
COPY package.json ./
RUN npm install
COPY ./ ./

# Default start command
CMD ["npm", "start"]