FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3003

ENV PORT=3003
ENV REACT_APP_API_URL=https://ubbi.fromseb.com:5000/api

CMD ["npm", "start"] 