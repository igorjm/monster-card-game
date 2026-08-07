# Monster Card Game

[![Live](https://img.shields.io/badge/demo-lobisomem--monstros.vercel.app-8f1d14?style=flat-square)](https://lobisomem-monstros.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<p align="center">
  <img src="public/art/logo.png" alt="Logo Lobisomem por Uma Noite — Monstros" width="180" />
</p>

<p align="center">
  <strong>Lobisomem por Uma Noite — Monstros</strong><br />
  Jogo multiplayer online, mobile-first e 100% em pt-BR.<br />
  3 a 7 jogadores · uma noite · um monstro entre vocês.
</p>

<p align="center">
  <a href="https://lobisomem-monstros.vercel.app"><strong>▶ Jogar agora</strong></a>
</p>

---

## O que é

Recriação online do jogo de dedução social *Lobisomem por Uma Noite: Monstros*:
cada celular é uma tela secreta, a noite é guiada por narração, e a lógica das
cartas roda **só no servidor** — ninguém vê a carta alheia.

> Arte pixel em `public/art/` é **original** (inspirada no estilo do jogo físico).
> Não redistribuímos scans das cartas oficiais.

## Papéis

| Time | Papéis |
| --- | --- |
| **Aliados** | Aldeão, Bruxa, Caçador, Vampiro |
| **Lobisomens** | Lobisomem (1 ou 2, conforme o número de jogadores) |
| **Mortos-vivos** | Zumbi, Múmia, Esqueleto |

### Baralho por número de jogadores (n + 3 no centro)

| Jogadores | Lobisomem | Caçador | Bruxa | Vampiro | Zumbi | Múmia / Esqueleto | Aldeão |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | 1 | 1 | 1 | 1 | 1 | 1 (um dos dois) | 0 |
| 4 | 2 | 1 | 1 | 1 | 1 | 1 (um dos dois) | 0 |
| 5 | 1 | 1 | 1 | 1 | 1 | ambos | 1 |
| 6 | 1 | 1 | 1 | 1 | 1 | ambos | 2 |
| 7 | 1 | 1 | 1 | 1 | 1 | ambos | 3 |

(Com 5–7 jogadores o baralho precisa de n+3 cartas; a tabela oficial impressa fica 1 aldeão abaixo — preenchido para bater o cemitério de 3.)

### Ações da noite

| Papel | Ação |
| --- | --- |
| **Caçador** | Esconde uma carta do centro **sem olhar**. Se for lobisomem, aliados vencem ao fim da discussão |
| **Bruxa** | Olha a carta de um jogador |
| **Lobisomem** | Reconhece os outros lobisomens e olha o centro **só no turno dele** (depois vira de novo) |
| **Zumbi** | Remove uma carta do centro, assume o papel e executa a ação dele |
| **Vampiro** | Troca a própria carta com a de um jogador ou do centro |
| Aldeão / Múmia / Esqueleto | Dormem |

## Como jogar

1. Alguém **cria a sala** e compartilha o código de 4 letras.
2. Cada um recebe uma carta secreta; **3 cartas** ficam no centro.
3. **Noite (~1m40s)** — narração chama cada papel na ordem (Caçador → Bruxa → Lobisomem → Zumbi → Vampiro).
4. **Discussão (5–10 min)** — blefem, acusem, mentam. Cartas removidas somem do centro.
5. **Revelação do Caçador** — se a carta escondida for lobisomem, aliados vencem na hora.
6. **Votação** (se não houve vitória do caçador) — quem tiver mais votos, morre.

### Vitória (cartas finais, após as trocas)

- Um **morto-vivo** morreu → Mortos-vivos vencem  
- Um **lobisomem** morreu → Aliados vencem  
- Caso contrário → Lobisomens vencem  

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4) na [Vercel](https://lobisomem-monstros.vercel.app)
- **Supabase** — Postgres + Realtime (broadcast de “estado mudou”)
- Motor puro e testável em [`lib/game/`](lib/game/)
- Mutações só via API routes com **service role** (server-authoritative)

```
Cliente (UI pt-BR)
    │  POST /api/rooms/...
    ▼
Next.js route handlers  ──service_role──►  Supabase Postgres
    │                                           │
    └── HTTP broadcast "update" ──► Realtime ──► clientes refetch view pessoal
```

## Estrutura

```
app/
  page.tsx                 # Home: criar / entrar
  sala/[code]/page.tsx     # Lobby → Noite → Discussão → Voto → Resultado
  api/rooms/               # create, join, start, action, vote, advance…
components/phases/         # Telas de cada fase
lib/game/                  # Engine, roles, timeline (+ testes)
lib/api/                   # Room store + views personalizadas
public/art/                # Pixel art HD original
supabase/schema.sql        # Tabela rooms + RLS
```

## Rodando localmente

Pré-requisitos: Node 20+, projeto [Supabase](https://supabase.com).

```bash
npm install
cp .env.example .env.local
# Preencha as 3 variáveis (URL, publishable key, secret key)
# Aplique supabase/schema.sql no SQL Editor do Supabase
npm run dev
```

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend (só Realtime) |
| `SUPABASE_SECRET_KEY` | **Somente servidor** — nunca no browser |
| `LIVEKIT_URL` | WebSocket LiveKit Cloud (`wss://…`) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Tokens de voz (somente servidor) |

```bash
npm test          # motor do jogo
npm run lint
npm run build
```

## Voz (lobby, dia, resultado)

Jogadores entram numa sala **LiveKit** no **lobby** e mantêm áudio/vídeo pela
**discussão**, **votação**, **resultado** e de volta ao **lobby**. O
**microfone liga automaticamente**; a **câmera é opcional**. A sessão só fecha
quando a **próxima noite** começa (ou ao sair da sala).

1. Crie um projeto em [LiveKit Cloud](https://cloud.livekit.io).
2. Copie URL, API Key e API Secret para `.env.local` / Vercel.
3. Redeploy. Sem essas variáveis, a UI mostra que a voz não está configurada.

## Áudio da noite

A narração oficial está em [`public/audio/monster.m4a`](public/audio/monster.m4a)
(~1m38s), com legendas sincronizadas em [`lib/game/timeline.ts`](lib/game/timeline.ts).

Ordem da noite: **Caçador → Bruxa → Lobisomem → Zumbi → Vampiro → amanhecer**.

Se o arquivo sumir, o app cai para síntese de voz pt-BR do navegador.

Música ambiente (lobby / home, em loop baixo):
[`public/audio/background.mp3`](public/audio/background.mp3) — some quando a
partida começa.

## PWA (instalar no celular)

O app é uma **Progressive Web App**: manifesto, ícones, tema escuro e service
worker (`public/sw.js`) com shell offline. Multiplayer ainda precisa de internet;
a tela `/offline` aparece se a navegação falhar sem rede.

No celular, um popup oferece instalar na tela inicial (Android: botão que abre o
instalador nativo; iOS: passos do Safari). Ao abrir pelo ícone instalado, outro
popup oferece ativar notificações.

**iPhone / iPad (Safari):** Compartilhar → *Adicionar à Tela de Início*.  
**Android (Chrome):** botão do popup ou menu → *Instalar app*.  
**Desktop (Chrome/Edge):** ícone de instalar na barra de endereço.

No `next dev` o SW não registra (evita conflito com HMR). Use `?sw=1` para
testar localmente, ou rode `npm run build && npm start`.

## Deploy

O projeto de produção está em **https://lobisomem-monstros.vercel.app**.

Para outro ambiente:

1. Importe o repo na Vercel.
2. Configure as 3 variáveis (Production + Preview).
3. Aplique `supabase/schema.sql` no Supabase.

## Aviso legal

Inspirado no jogo de tabuleiro *Lobisomem por Uma Noite: Monstros* (e na série
*One Night Ultimate Werewolf*). Este repositório **não é afiliado** aos
detentores da marca. A implementação e a arte pixel em `public/art/` são
originais.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE) — código e arte original deste repositório.
