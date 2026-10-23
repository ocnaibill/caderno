FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# content/ e data/ costumam vir montados como volume (ver docker-compose.yml)
# — o que está copiado aqui é só o fallback caso suba sem volume nenhum.
CMD ["bun", "run", "start"]
