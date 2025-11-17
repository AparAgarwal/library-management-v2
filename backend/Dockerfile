FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies (dev image)
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copy source code (respects .dockerignore)
COPY . .

# Create uploads directory
RUN mkdir -p uploads/avatars

EXPOSE 5000

CMD ["npm", "run", "dev"]
