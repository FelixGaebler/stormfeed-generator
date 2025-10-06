FROM node:22-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts
RUN npm rebuild better-sqlite3 --build-from-source

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
