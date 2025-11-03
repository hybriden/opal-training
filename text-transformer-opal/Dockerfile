# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
