FROM node:24.14-alpine AS base
WORKDIR /src

FROM base AS dev
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]