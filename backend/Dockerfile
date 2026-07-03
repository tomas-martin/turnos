FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy application files
COPY . .

# Generate Prisma Client and compile TypeScript
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
