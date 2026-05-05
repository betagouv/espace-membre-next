FROM node:22-slim

WORKDIR /app

# first, copy only the dependencies files over to preserve caching of
# this step when any other files changes
COPY package.json package-lock.json ./
RUN npm install

# now copy everything else
COPY . ./

EXPOSE 8100

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["npm", "run", "dev"]
