FROM node:alpine
# Папка приложения
WORKDIR /app
# Установка зависимостей
COPY package*.json ./
RUN npm install
# Для использования в продакшне
# RUN npm install --production
# Копирование файлов проекта
COPY . .
# Уведомление о порте, который будет прослушивать работающее приложение
EXPOSE 7071
# Запуск проекта
CMD ["npm", "start"]