 # Stage 1: Build frontend
FROM node:20 AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20 AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
# Copy shared code if needed
COPY shared/ /app/shared/
# Copy frontend build output to backend's public directory (adjust as needed)
COPY --from=frontend-build /app/client/dist ./public

# Stage 3: Production image
FROM node:20-slim
WORKDIR /app/server
COPY --from=backend-build /app/server .
COPY --from=backend-build /app/shared /app/shared
COPY --from=backend-build /app/server/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start:prod"] 