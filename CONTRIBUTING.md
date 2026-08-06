# Contribuindo

Obrigado por contribuir com o **Monster Card Game**!

## Setup

```bash
npm install
cp .env.example .env.local
# Preencha as variáveis Supabase (veja o README)
npm run dev
```

Aplique o schema em [`supabase/schema.sql`](supabase/schema.sql) no seu projeto Supabase.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor local |
| `npm test` | Testes do motor do jogo |
| `npm run lint` | ESLint |
| `npm run build` | Build de produção |

## Boas práticas

- Mantenha a lógica secreta das cartas no servidor (`app/api/**` + `lib/game/**`).
- Não exponha `SUPABASE_SECRET_KEY` no cliente.
- UI e textos em **pt-BR**.
- Prefira mudanças pequenas e focadas; rode `npm test` e `npm run lint` antes do PR.
- Arte nova: pixel art HD no estilo Halloween escuro, em `public/art/`.

## Áudio da noite

Arquivo oficial: `public/audio/monster.m4a`.
Legendas e janelas de ação: [`lib/game/timeline.ts`](lib/game/timeline.ts).

Ordem: Caçador → Bruxa → Lobisomem → Zumbi → Vampiro.

## Aviso legal

Este projeto é uma **recriação online inspirada** no jogo de tabuleiro
*Lobisomem por Uma Noite: Monstros*. Não use scans/fotos das cartas oficiais no
repositório — a arte em `public/art/` é original.
