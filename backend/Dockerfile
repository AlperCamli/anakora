FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 1337
CMD ["npm", "run", "start"]

