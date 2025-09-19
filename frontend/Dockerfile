# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy rest and build
COPY . .
RUN npm run build

# ---- run stage (Nginx) ----
FROM nginx:alpine AS prod
# Static files
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx config (serves SPA and proxies /api to backend)
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
