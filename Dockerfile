FROM node:lts-slim
WORKDIR /app
COPY ./main.mjs .
CMD [ "node", "main.mjs" ]
