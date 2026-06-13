FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache gettext \
    && rm -f /etc/nginx/conf.d/default.conf

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
