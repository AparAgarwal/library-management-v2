FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && \
    npm cache clean --force

# Copy source code (respects .dockerignore)
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
