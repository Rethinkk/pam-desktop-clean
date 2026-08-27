FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PAM_SERVER_HOST=0.0.0.0

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server ./server

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e 'const port=process.env.PAM_SERVER_PORT||process.env.PORT||8787; fetch("http://127.0.0.1:"+port+"/api/pam/health").then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'

CMD ["npm", "run", "server:start"]
