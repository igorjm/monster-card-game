# Arquitetura

## Princípio: servidor autoritativo

Cartas, votos e o resultado da noite **nunca** são confiados ao cliente.
Cada jogador recebe só uma `RoomView` personalizada (`lib/api/views.ts`):

- própria carta e infos privadas da noite
- lista pública de jogadores (sem roles)
- fase, timers e (no fim) revelação completa

O Realtime só avisa `update` com `{ version }`. O cliente refetch via
`GET /api/rooms/[code]/view?token=...`.

## Identidade

Sem login. Cada device gera um `token` em `localStorage` (`lib/client/identity.ts`).
O token fica no JSON `players` no Postgres; o `id` público é UUID separado
(usado para mirar ações / votos).

## Fluxo de fases

```
lobby → noite → discussao → votacao → resultado → (restart) lobby
```

- `POST .../start` — host; chama `dealGame`
- `POST .../action` — ações da noite; `applyNightAction` valida janela da timeline
- `POST .../advance` — qualquer cliente (idempotente) ou host força o fim da discussão
- `POST .../vote` — ao completar todos os votos, `resolveVotes`
- `POST .../restart` — host volta ao lobby

## Concorrência

`updateRoom` faz read-modify-write com `version` otimista (retry em conflito).

## Timeline da noite

[`lib/game/timeline.ts`](../lib/game/timeline.ts) define segmentos em segundos
desde `nightStartedAt`. Clientes sincronizam com `clockOffsetMs` a partir de
`serverNow`.
