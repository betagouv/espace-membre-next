web: ./start-and-wait-to-init.sh
clock: node -r ./dist/build-helpers/raw-loader.js ./dist/src/server/schedulers/cron.js
postdeploy: npm run migrate
