# Use Node.js LTS base image
FROM node:20-slim as builder

# Set working directory
WORKDIR /app

# Copy dependency configs
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for building)
RUN npm install

# Copy project files
COPY . .

# Build React client
RUN npm run build

# Prune devDependencies to keep the image lean
RUN npm prune --production

# Final runtime image
FROM node:20-slim

WORKDIR /app

# Copy built application and backend modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dist ./dist

# Expose dynamic Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Start Express server
CMD ["node", "server.js"]
