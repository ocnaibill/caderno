# Deploy no homelab

Preparei o repo pra rodar em container, mas **não tenho acesso ao seu homelab** — tudo daqui pra frente é você rodando. Esse documento é só o roteiro.

## O que já está pronto

- `Dockerfile` — imagem `oven/bun:1`, instala com `--production`, roda `bun run start`.
- `docker-compose.yml` — monta `content/` como volume (importante: é onde `/escrever` grava as folhas novas, direto no host) e `data/` (o SQLite) num volume nomeado.
- `.env.example` — todas as variáveis que o app lê. Copie pra `.env` e preencha antes de subir.
- **Autenticação nas rotas administrativas** (`/escrever`, `/comentarios/moderar`, `/folha/:slug/disparar`): HTTP Basic via `ADMIN_USER`/`ADMIN_PASSWORD`. Sem essas duas variáveis configuradas, o painel fica **desligado** (503), não aberto — então não esquece de configurar antes de expor a porta pra internet.
- `GET /saude` — responde `ok`, pra health check do Docker/proxy.

## Passo a passo (no host do homelab)

```bash
git clone <url-do-repo> caderno
cd caderno
cp .env.example .env
# edita o .env: ADMIN_USER, ADMIN_PASSWORD, CADERNO_URL (domínio final),
# e RESEND_API_KEY/RESEND_FROM se já tiver conta no Resend

docker compose up -d --build
```

O `reindex` já roda automaticamente dentro do container? **Não** — hoje só roda via `bun run reindex` (manual) ou quando você publica pela `/escrever` (que reindexa sozinho). Se for subir o container já com as folhas atuais do `content/`, entra no container uma vez e roda:

```bash
docker compose exec caderno bun run reindex
```

## O que falta você decidir/fazer (não dá pra eu adiantar)

- **Proxy reverso**: o `docker-compose.yml` só expõe a porta `3000` do host — não mexi em Nginx Proxy Manager nem Cloudflare Tunnel, porque não tenho visibilidade de como seus outros serviços estão configurados lá. É só apontar um proxy host novo pra `<ip-do-ct>:3000`, do jeito que você já faz com o resto.
- **Domínio do Resend**: `RESEND_FROM` precisa ser de um domínio verificado no Resend (ou o sandbox `onboarding@resend.dev`, que só manda pro seu próprio e-mail de teste). Isso é configuração do lado do Resend, não do código.
- **Backup do `data/caderno.sqlite`**: hoje só guarda coisa que não está em `content/` — comentários, assinantes, curtidas/salvos, histórico de envios. Vale entrar na rotina de backup que você já tem pros outros serviços (o homelab-watchdog, Syncthing, etc.) — eu não configurei nada disso aqui.
- **`content/` sincronizado com o git**: se você escrever uma folha pela `/escrever` já no ar no homelab, ela é gravada **no volume do container**, não automaticamente commitada. Pra não perder isso (ou pra editar continuar funcionando do seu Mac também), você precisa decidir uma rotina — git pull no host depois de escrever lá, ou Syncthing na pasta `content/`, por exemplo. Não implementei nada automático pra isso, é decisão sua de workflow.

## O que eu testei localmente (não testei o Docker de verdade)

Rodei tudo via `bun run dev`/`bun run start` direto, sem Docker — não tenho como testar `docker build`/`docker compose up` nesse ambiente. Se o build falhar por algum motivo (versão de base image, etc.), é o primeiro lugar pra olhar.
