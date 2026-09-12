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

Convidados continuam sem login: cada aparelho gera um token aleatório em
`localStorage`. O `id` público é outro UUID. Criar sala, comprar, restaurar
compras e sincronizar progressão exige Supabase Auth por e-mail e perfil adulto.
Autorização usa o `user.id` verificado pelo servidor, nunca metadados editáveis.

## Comércio e privacidade

`entitlements` registra fonte, transação externa única, concessão e revogação.
Webhooks são idempotentes e reconciliam o estado atual do provedor. `RoomView`
expõe somente flags derivadas de tema/mídia/anúncio. Chaves e registros de
pagamento nunca chegam ao convidado.

Todas as tabelas públicas têm RLS e privilégios diretos de `anon` e
`authenticated` revogados. Somente rotas do servidor usam a chave secreta.

## Sala privada e mídia

Novos convidados ficam pendentes até aprovação do anfitrião. Salas expiram em
24 horas; relatos em até 90 dias. Microfone e câmera são opt-in, câmera é 360p,
fica indisponível durante a noite e nenhuma comunicação é gravada/transcrita.
Restrições de mídia atualizam também as permissões de publicação no LiveKit.

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
