import type { ThemePack } from "./types";
import { buildNarrationSubtitles } from "./shared";

const lines = {
  intro: "A cidade dormiu, mas o Arquivo continuou trocando de mãos.",
  cacador: "Olheiro, acorde e esconda uma pasta sem ler a capa.",
  bruxa: "Tia do Zap, acorde e encaminhe a verdade de uma pessoa.",
  lobisomem: "Miliciano, acorde e reconheça quem controla o mesmo pedaço.",
  zumbi: "Laranja, acorde e assuma a ficha que sobrou no Arquivo.",
  vampiro: "Cabo Eleitoral, acorde e troque as fichas antes da manchete.",
  amanhecer: "A cidade acordou. Agora todo mundo tem uma versão oficial.",
};

export const rioSatiraTheme: ThemePack = {
  schemaVersion: 1,
  id: "rio-satira",
  status: "preview",
  name: "Rio: Arquivo da Madrugada",
  shortName: "Rio Sátira",
  locale: "pt-BR",
  brand: {
    title: "Rio: Arquivo da Madrugada",
    eyebrow: "ARQUIVO DA",
    name: "MADRUGADA",
    tagline: "Morro e asfalto · uma noite · versões demais",
    description: "Sátira de dedução social sobre poder, mídia e identidade política no Rio.",
    shareText: "Tem pasta circulando no Arquivo da Madrugada!\nSala {code}: {url}",
  },
  terminology: {
    center: "Arquivo",
    centerPositionNames: ["pasta esquerda", "pasta central", "pasta direita"],
    village: "cidade",
    wolfPack: "esquema",
  },
  roles: {
    aldeao: { name: "Morador", letter: "M", description: "Só quer descobrir quem manda no esquema e trabalhar amanhã.", nightHint: "Feche os olhos. Amanhã cedo ainda tem cidade.", artAlt: "Arte provisória do Morador" },
    lavrador: { name: "Motoboy", letter: "M", description: "Conhece todos os atalhos, mas nesta noite não abre nenhuma pasta.", nightHint: "Estacione a moto e espere a cidade acordar.", artAlt: "Arte provisória do Motoboy" },
    cacador: { name: "Olheiro", letter: "O", description: "Guarda uma pasta do Arquivo sem saber o que há dentro.", nightHint: "Escolha uma pasta para esconder sem abrir.", artAlt: "Arte provisória do Olheiro" },
    bruxa: { name: "Tia do Zap", letter: "T", description: "Descobre a ficha de alguém e vê quais pastas sumiram, antes de encaminhar sem contexto.", nightHint: "Confira uma pessoa e conte as pastas no Arquivo.", artAlt: "Arte provisória da Tia do Zap" },
    lobisomem: { name: "Miliciano", letter: "M", description: "Reconhece o esquema e consulta as pastas restantes apenas no seu turno.", nightHint: "Veja quem está no esquema e memorize o Arquivo.", artAlt: "Arte provisória do Miliciano" },
    mumia: { name: "Influencer", letter: "I", description: "Não age à noite e monetiza o cancelamento se receber os votos.", nightHint: "Prepare a retratação e espere a timeline acordar.", artAlt: "Arte provisória do Influencer" },
    esqueleto: { name: "Comentarista", letter: "C", description: "Não age à noite e vence se a cidade transformar opinião em sentença.", nightHint: "Guarde o palpite até o debate.", artAlt: "Arte provisória do Comentarista" },
    zumbi: { name: "Laranja", letter: "L", description: "Assume uma ficha do Arquivo e passa a agir como ela.", nightHint: "Escolha a ficha que vai ficar no seu nome.", artAlt: "Arte provisória do Laranja" },
    vampiro: { name: "Cabo Eleitoral", letter: "C", description: "Troca sua ficha com alguém ou com uma pasta do Arquivo em segredo.", nightHint: "Troque duas versões antes do fechamento da edição.", artAlt: "Arte provisória do Cabo Eleitoral" },
  },
  teams: {
    aliados: { name: "Cidade", goal: "Exponham pelo menos um Miliciano.", winBlurb: "A cidade abriu a pasta certa." },
    lobisomens: { name: "Esquema", goal: "Controlem a narrativa e sobrevivam ao voto.", winBlurb: "O esquema arquivou o caso." },
    "mortos-vivos": { name: "Cancelados", goal: "Façam o voto cair no Influencer ou no Comentarista.", winBlurb: "O cancelamento virou engajamento." },
    zumbi: { name: "Laranja", goal: "Assuma outra ficha; ela define sua vitória.", winBlurb: "A ficha mudou de dono." },
  },
  rulesCopy: {
    deckSummary: "O elenco mecânico não muda: três fichas sempre ficam no Arquivo.",
    intro: "Cada pessoa recebe uma ficha secreta e três pastas ficam no Arquivo.",
    voting: "Quando amanhecer, comparem versões e votem em quem controla a história.",
    winPriority: "Cancelados vencem se virarem o alvo; a Cidade vence ao expor o esquema ou pela pasta do Olheiro.",
  },
  narration: {
    ttsLocale: "pt-BR",
    segments: {
      intro: { narration: lines.intro },
      cacador: { narration: lines.cacador, actorPrompt: "Esconda uma pasta do Arquivo sem olhar." },
      bruxa: { narration: lines.bruxa, actorPrompt: "Veja uma ficha e observe o Arquivo." },
      lobisomem: { narration: lines.lobisomem, actorPrompt: "Reconheça o esquema e memorize o Arquivo." },
      zumbi: { narration: lines.zumbi, actorPrompt: "Assuma uma ficha e execute a ação dela." },
      vampiro: { narration: lines.vampiro, actorPrompt: "Troque sua ficha com alguém ou com o Arquivo." },
      amanhecer: { narration: lines.amanhecer },
    },
    subtitles: buildNarrationSubtitles(lines),
  },
  ambient: { audioSrc: "/audio/background.mp3", volume: 0.12 },
  palette: {
    background: "#071b2c", backgroundSoft: "#102f49", backgroundGlow: "#155b72",
    surface: "#123f5b", surfaceStrong: "#0b2232", primary: "#a52b3b",
    primaryStrong: "#d83c50", accent: "#f4bd3f", accentSoft: "#ffe083",
    text: "#f5f0dc", textMuted: "#b9c7c9", border: "#030b12",
    positive: "#3dbf8a", danger: "#e44b55",
  },
};

