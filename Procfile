web: npm start
clock: npm run start-jobs-prod
postdeploy: sh -c 'if [ "$APP" = "espace-membre-cron" ]; then echo "skip migrate"; else npm run migrate; fi'
