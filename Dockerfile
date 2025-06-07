# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install additional dependencies that might be needed
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the development server port
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]
