FROM node:16.13.0

WORKDIR /app

COPY . .

USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]