import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return <LegalPage title="PRIVACIDADE">
    <p>Usamos um token aleatório no dispositivo para convidados. Contas por e-mail são opcionais para convidados e exigidas para anfitriões adultos, compras e sincronização.</p>
    <p>Guardamos faixa etária, nunca a data de nascimento. Salas são privadas, expiram em 24 horas e não aparecem em busca pública. Áudio e vídeo trafegam em tempo real: não gravamos nem transcrevemos.</p>
    <p>Registros de compra são mantidos para cumprir obrigações financeiras, restaurar compras e tratar estornos. Relatos de segurança expiram em até 90 dias, salvo necessidade legal de preservação.</p>
    <p>Não enviamos identificadores de publicidade ou perfis comportamentais de convidados, adolescentes ou pessoas com idade desconhecida. Durante a beta, a área pós-partida mostra apenas novidades internas.</p>
    <p>Para acesso, correção ou exclusão, use a área da conta ou escreva para o contato de suporte configurado pelo operador antes do lançamento.</p>
  </LegalPage>;
}
