FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=4173
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.mjs ./server.mjs
COPY --from=build /app/server-path.mjs ./server-path.mjs
COPY --from=build /app/audit.mjs ./audit.mjs
EXPOSE 4173
USER node
CMD ["node", "server.mjs"]
