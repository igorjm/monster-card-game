# Contribuindo

Crie uma branch curta, mantenha o servidor autoritativo e adicione testes para regras, permissões ou pagamentos alterados.

Antes de enviar uma mudança:

```bash
npm test
npm run lint
npm run assets:rights
npm run build
```

Não adicione scans, fotografias, logotipos, personagens, falas, músicas, figurinos ou semelhanças de terceiros. Um pack só pode entrar no registro público com proveniência completa, direitos aprovados e liberação editorial. Mundos de gênero podem evocar uma comédia de estúdio, espionagem, cinema de criaturas ou ópera espacial, mas não uma obra identificável.

Ativos novos precisam de entrada em `docs/legal/ASSET_PROVENANCE.json`. Segredos e chaves nunca entram no Git. Alterações de banco devem ser criadas com `supabase migration new` e preservar RLS; tabelas públicas permanecem sem políticas para clientes porque o acesso passa pelas rotas do servidor.
