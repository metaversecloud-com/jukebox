FROM --platform=linux/arm64 node:20.10-alpine3.19
WORKDIR /app
ADD package* ./
ADD server ./server
ADD client ./client
EXPOSE 3000
ENTRYPOINT [ "npm", "start" ]
