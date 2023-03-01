# Node JS base image
FROM node:12.18.0

RUN mkdir /app
WORKDIR /app
COPY . /app/

# Install node modules and build
RUN npm install && npm run build

# Expose port
EXPOSE 80

# Start application
ENTRYPOINT ["node", "./bin/www"]
