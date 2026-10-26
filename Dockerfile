FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 9091
ENV PORT=9091
ENV NODE_ENV=production
CMD ["npm", "start"]
