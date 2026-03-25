# Admin CMS — SPA with BrowserRouter; nginx fallback to index.html
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Authenticated API base (no /public). Example: https://api.yourdomain.com/api/v1
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_GA_DASHBOARD_URL
ENV VITE_GA_DASHBOARD_URL=$VITE_GA_DASHBOARD_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
