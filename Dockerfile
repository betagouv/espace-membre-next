FROM node:22-slim

WORKDIR /app

# first, copy only the dependencies files over to preserve caching of
# this step when any other files changes
COPY package.json package-lock.json ./
RUN npm install

# Install Chromium + its system dependencies so the Cucumber E2E tests
# (which drive a real browser via Playwright) can run in this base image.
RUN npx playwright install --with-deps chromium

# now copy everything else
COPY . ./

EXPOSE 8100

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["npm", "run", "dev"]
