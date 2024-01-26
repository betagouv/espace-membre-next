# Start from the Node.js version 18 image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Switch to 'node' user for security reasons
USER node

# Inform Docker that the container listens on port 3000 at runtime
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]
