FROM node:lts

WORKDIR /app

RUN chown node:node /app

COPY . .

RUN npm install -g nodemon
RUN npm install -g typescript
RUN npm install -g

USER node

EXPOSE 8100
# CMD ["node", "index.js"]
RUN npm run start
