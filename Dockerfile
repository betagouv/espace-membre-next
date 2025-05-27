FROM node:20-slim

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install --no-install-recommends -y \
    build-essential \
    libpq-dev \
    libyaml-dev \
    git

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
