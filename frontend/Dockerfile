FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# Copy project files and build
COPY . .
RUN npm run build

# Serve build output via Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
