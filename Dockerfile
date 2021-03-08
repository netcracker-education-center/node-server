FROM node:10-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install 

COPY . .

EXPOSE 7071

CMD ["npm", "start"]