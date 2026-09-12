# Mesa Oculta (nome provisório)

Motor multiplayer, mobile-first, para jogos privados de dedução social. O primeiro mundo descritivo é **Vila das Criaturas**. “Mesa Oculta” é um nome de trabalho: nenhum lançamento comercial ou submissão a lojas pode acontecer antes do registro de liberação de marca, domínio, lojas e perfis sociais em `docs/legal/RELEASE_GATES.md`.

## Estado comercial

- PWA primeiro; aplicativos iOS e Android juntos somente após os indicadores do plano comercial.
- Convidados entram sem conta ou pagamento.
- Somente uma conta adulta por e-mail pode hospedar, comprar, sincronizar progressão ou liberar câmeras.
- Starter gratuito; remover anúncios por R$ 14,90; packs permanentes por R$ 12,90; fundadores por R$ 34,90.
- Sem assinatura, moeda consumível, recompensa aleatória, urgência artificial ou vantagem de jogo.
- Packs `Estúdio em Caos` e `Órbita de Sabotagem` estão no catálogo, mas a venda fica bloqueada até arte, texto e direitos estarem aprovados.

O código verifica também `COMMERCIAL_RELEASE_ENABLED=1`. Sem essa variável, nenhuma compra PWA é iniciada.

## Segurança do grupo

As salas são privadas, aprovadas pelo anfitrião e expiram em 24 horas. Microfone e câmera exigem ação explícita; a câmera começa desligada, é limitada a 360p e não pode ser publicada durante a noite. Não há gravação nem transcrição. O anfitrião pode aprovar, recusar, silenciar, desativar câmera e bloquear dispositivos. Há relato dentro da sala e páginas de segurança, privacidade, termos e exclusão de conta.

## Arquitetura

```text
PWA / futuro cliente Capacitor
       │ views derivadas (sem dados de pagamento)
       ▼
Next.js Route Handlers ── service role ──► Supabase Postgres/Auth
       │                                      │
       ├── LiveKit tokens com fontes limitadas│
       └── Mercado Pago / RevenueCat webhooks ┘
```

O servidor é autoritativo para cartas, ações, votos, resultados, entitlements e mídia permitida. Realtime transmite somente uma notificação de versão; cada aparelho busca sua visão pessoal. O token anônimo identifica convidados no dispositivo; tokens Supabase autenticam somente operações de conta/anfitrião.

## Desenvolvimento

Pré-requisitos: Node 22+, Docker e Supabase CLI.

```bash
npm install
npm run db:start
npm run db:reset
npm run dev
```

Validação:

```bash
npm test
npm run lint
npm run assets:rights
npm run build
```

Variáveis estão documentadas em `.env.example`. Chaves secretas de Supabase, LiveKit, Mercado Pago e RevenueCat permanecem exclusivamente no servidor.

## Licenciamento e conteúdo

O motor publicado neste repositório permanece sob MIT. Concessões anteriores não são revogadas retroativamente. Novas marcas, packs premium, materiais comerciais e binários de loja devem viver na camada privada descrita em `COMMERCIAL_CONTENT_LICENSE.md`.

Os sistemas e fluxos de jogo só seguem para exploração comercial após opinião jurídica brasileira. Arte, texto, áudio, fontes, ícones e identidade visual têm auditoria independente em `docs/legal/ASSET_PROVENANCE.md`.
