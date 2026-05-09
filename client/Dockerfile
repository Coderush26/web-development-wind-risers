FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Vite replaces import.meta.env.VITE_* at build time — pass keys as build args
ARG VITE_PUSHER_KEY
ARG VITE_PUSHER_CLUSTER
ENV VITE_PUSHER_KEY=$VITE_PUSHER_KEY
ENV VITE_PUSHER_CLUSTER=$VITE_PUSHER_CLUSTER

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
