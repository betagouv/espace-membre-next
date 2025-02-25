#!/bin/sh
set -x

echo "Start the server in background"
node dist/src/server/server.js &

# Store the server process ID
next_pid=$!

stop_server() {
  echo "Shut down Next.js server..."
  kill $next_pid
  exit 0
}

# Bind the callback to the SIGINT signal to shut down the background process properly
trap stop_server INT

check_server_and_init() {
  timeout=60
  counter=0

  host="${HOSTNAME:-localhost}:${PORT:-3000}"
  healthcheck_url="http://$host"

  echo "Healthcheck URL: $healthcheck_url"

  while true; do
    response=$(curl --write-out %{http_code} --silent --output /dev/null "$healthcheck_url")
    if [ "$response" = "200" ]; then
      echo "Server is ready. Proceeding to init..."
      break
    fi

    if [ $counter -eq $timeout ]; then
      echo "Error: the Next.js server is not ready within the expected timeframe"

      # Kill the server since it has no reason to continue
      kill $next_pid
      exit 1
    fi

    echo "The Next.js server is not yet ready on $healthcheck_url"

    sleep 1
    counter=$((counter+1))
  done

  echo "Will curl init"
  curl http://$host/api/init
}

# In parallel wait for the server readiness to init some services
check_server_and_init

# Wait for the Next.js server to return
wait

echo "The wait instruction has exited normally"
