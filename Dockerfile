FROM node:16

RUN apt-get update && apt-get upgrade -y

WORKDIR /app

COPY package.json package-lock.json .

RUN npm install

COPY . .

EXPOSE 8100
RUN npm run dev
