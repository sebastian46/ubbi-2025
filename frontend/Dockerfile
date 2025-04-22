FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Define build argument with default value
ARG REACT_APP_API_URL=http://localhost:5000/api
# Set it as an environment variable
ENV REACT_APP_API_URL=$REACT_APP_API_URL

EXPOSE 3003
ENV PORT=3003

CMD ["npm", "start"] 