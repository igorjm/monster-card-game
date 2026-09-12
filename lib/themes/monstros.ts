import type { ThemePack } from "./types";
import { buildNarrationSubtitles, STARTER_PALETTE } from "./shared";

const lines = {
  intro: "As lanternas da vila se apagam. Cada pessoa protege um destino que talvez mude antes do amanhecer.",
  cacador: "Guardião da trilha, retire um destino do Cemitério sem revelar o que escolheu.",
  bruxa: "Oráculo, consulte uma pessoa e depois confira os espaços do Cemitério.",
  lobisomem: "Criaturas da alcateia, reconheçam seus pares e memorizem o Cemitério.",
  zumbi: "Errante, tome um destino do Cemitério e cumpra a ação que encontrou.",
  vampiro: "Metamorfo, troque seu destino com outra pessoa ou com o Cemitério.",
  amanhecer: "As lanternas voltam a acender. Abram os olhos, comparem histórias e decidam juntos.",
};

/** Descriptive working pack. Public release remains gated by its rights record. */
export const vilaCriaturasTheme: ThemePack = {
  schemaVersion: 1,
  id: "vila-criaturas",
  status: "preview",
  access: "starter",
  rights: {
    themeId: "vila-criaturas",
    status: "review-required",
    owner: "Igor Melo",
    provenanceDocument: "docs/legal/ASSET_PROVENANCE.md",
    legalOpinionDate: null,
    trademarkClearanceDate: null,
    storeClearanceDate: null,
    publishable: false,
  },
  name: "Vila das Criaturas",
  shortName: "Criaturas",
  locale: "pt-BR",
  brand: {
    title: "Mesa Oculta — Vila das Criaturas",
    eyebrow: "MESA OCULTA",
    subtitle: "VILA DAS",
    name: "CRIATURAS",
    tagline: "3 a 7 pessoas · pistas trocadas · uma decisão em grupo",
    description: "Dedução social privada para famílias e amigos, guiada por celular.",
    logoSrc: "/art/logo.png",
    cardBackSrc: "/art/card-back.png",
    shareText: "Sua mesa está pronta na Vila das Criaturas.\nSala privada {code}: {url}",
  },
  terminology: {
    center: "Cemitério",
    centerPositionNames: ["esquerda", "meio", "direita"],
    village: "vila",
    wolfPack: "alcateia",
  },
  roles: {
    aldeao: {
      name: "Aldeão", letter: "A",
      description: "Não altera cartas. Na conversa, compare relatos e procure contradições.",
      nightHint: "Descanse e escute a condução até o amanhecer.",
      artSrc: "/art/aldeao.png", artAlt: "Aldeão de roupa verde",
    },
    lavrador: {
      name: "Aldeão", letter: "A",
      description: "Não altera cartas. Sua ilustração distingue este morador do outro aldeão.",
      nightHint: "Descanse e escute a condução até o amanhecer.",
      artSrc: "/art/lavrador.png", artAlt: "Aldeão de roupa preta com arado",
    },
    cacador: {
      name: "Caçador", letter: "C",
      description: "Retira uma carta do centro sem revelar seu conteúdo. A carta só aparece no desfecho.",
      nightHint: "Escolha uma posição do Cemitério para retirar sem olhar.",
      artSrc: "/art/cacador.png", artAlt: "Caçador",
    },
    bruxa: {
      name: "Bruxa", letter: "B",
      description: "Consulta a carta de uma pessoa e percebe quais espaços do Cemitério continuam ocupados.",
      nightHint: "Consulte uma pessoa e depois observe o Cemitério.",
      artSrc: "/art/bruxa.png", artAlt: "Bruxa",
    },
    lobisomem: {
      name: "Lobisomem", letter: "L",
      description: "Reconhece a alcateia e memoriza o Cemitério no próprio turno.",
      nightHint: "Identifique a alcateia e memorize o Cemitério.",
      artSrc: "/art/lobisomem.png", artAlt: "Lobisomem",
    },
    mumia: {
      name: "Múmia", letter: "M",
      description: "Permanece imóvel na ronda e transforma a escolha do grupo em sua própria vitória.",
      nightHint: "Não faça nenhuma ação; aguarde a conversa.",
      artSrc: "/art/mumia.png", artAlt: "Múmia",
    },
    esqueleto: {
      name: "Esqueleto", letter: "E",
      description: "Permanece imóvel na ronda e vence quando o grupo aponta para ele.",
      nightHint: "Não faça nenhuma ação; aguarde a conversa.",
      artSrc: "/art/esqueleto.png", artAlt: "Esqueleto",
    },
    zumbi: {
      name: "Zumbi", letter: "Z",
      description: "Toma um destino do centro, passa a seguir esse objetivo e executa sua ação quando houver uma.",
      nightHint: "Escolha um destino do Cemitério para assumir.",
      artSrc: "/art/zumbi.png", artAlt: "Zumbi",
    },
    vampiro: {
      name: "Vampiro", letter: "V",
      description: "Troca o próprio destino com o de outra pessoa ou com uma posição central, sem revelar a mudança.",
      nightHint: "Escolha uma pessoa ou posição do Cemitério para a troca.",
      artSrc: "/art/vampiro.png", artAlt: "Vampiro",
    },
  },
  teams: {
    aliados: { name: "Vigias", goal: "Encontrem uma criatura da alcateia na decisão final.", winBlurb: "As pistas convergiram antes do amanhecer." },
    lobisomens: { name: "Alcateia", goal: "Desviem a suspeita para que a alcateia permaneça oculta.", winBlurb: "A versão da alcateia convenceu a mesa." },
    "mortos-vivos": { name: "Despertos", goal: "Façam o grupo escolher uma Múmia ou um Esqueleto.", winBlurb: "A acusação despertou o destino adormecido." },
    zumbi: { name: "Errante", goal: "Assuma um novo destino; ele passa a definir sua vitória.", winBlurb: "O destino mudou de mãos." },
  },
  rulesCopy: {
    deckSummary: "A composição cresce com a mesa; três destinos sempre permanecem no Cemitério.",
    intro: "Cada pessoa guarda um destino secreto. Três destinos ficam no centro e podem mudar durante a ronda.",
    voting: "Depois da ronda guiada, comparem versões e escolham uma pessoa. A carta retirada só aparece no desfecho.",
    winPriority: "Os mortos-vivos vencem quando um deles é escolhido. Os aliados vencem ao encontrar a alcateia ou pela carta retirada; nos demais casos, vence a alcateia.",
  },
  narration: {
    ttsLocale: "pt-BR",
    segments: {
      intro: { narration: lines.intro },
      cacador: { narration: lines.cacador, actorPrompt: "Retire uma posição sem olhar o destino." },
      bruxa: { narration: lines.bruxa, actorPrompt: "Consulte uma pessoa e observe o centro." },
      lobisomem: { narration: lines.lobisomem, actorPrompt: "Reconheça seus pares e memorize o centro." },
      zumbi: { narration: lines.zumbi, actorPrompt: "Assuma um destino e cumpra a ação dele." },
      vampiro: { narration: lines.vampiro, actorPrompt: "Faça uma troca sem anunciar os destinos." },
      amanhecer: { narration: lines.amanhecer },
    },
    subtitles: buildNarrationSubtitles(lines),
  },
  ambient: { audioSrc: "/audio/background.mp3", volume: 0.18 },
  palette: STARTER_PALETTE,
};
