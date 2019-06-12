FROM node:alpine
WORKDIR /var/lib/www
COPY package*.json ./
RUN npm install
COPY server .
EXPOSE 5000
CMD ["node", "index.js"]
