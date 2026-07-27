# --- Étape build : compile TypeScript -> dist/ ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Étape runtime : image légère, dépendances de prod uniquement ---
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 5000
# Sonde de disponibilité : l'orchestrateur redémarre le conteneur si /health ne
# répond plus (base injoignable, process figé...).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1
# JWT_SECRET, DB_*, SMTP_*, CORS_ORIGIN doivent être fournis via l'environnement.
CMD ["node", "dist/serveur.js"]
