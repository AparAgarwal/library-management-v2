FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Install dev dependencies for development mode
RUN npm install --only=development

# Copy source code (respects .dockerignore)
COPY . .

# Create uploads directory
RUN mkdir -p uploads/avatars

EXPOSE 5000

CMD ["npm", "run", "dev"]
