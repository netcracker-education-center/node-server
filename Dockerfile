FROM node:alpine
# App dir
WORKDIR /app
# Dependency install
COPY package*.json ./
RUN npm install --production
# Copy project files
COPY . .
# Port, which will use docker
EXPOSE 7071
# Project start
CMD ["npm", "start"]