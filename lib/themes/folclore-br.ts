import type { ThemePack } from "./types";
import { buildNarrationSubtitles } from "./shared";

const lines = {
  intro: "Na beira do mato, a fogueira baixou e toda história resolveu andar.",
  cacador: "Caipora, acorde e esconda um caminho no Cruzeiro.",
  bruxa: "Cuca, acorde e descubra qual destino anda mentindo.",
  lobisomem: "Lobisomem, acorde e reconheça o seu uivo.",
  zumbi: "Encantado, acorde e tome um destino do Cruzeiro.",
  vampiro: "Boto, acorde e troque de pele antes que percebam.",
  amanhecer: "O galo cantou. Abram os olhos e desconfiem das histórias.",
};

export const folcloreBrTheme: ThemePack = {
  schemaVersion: 1,
  id: "folclore-br",
  status: "preview",
  name: "Uma Noite no Folclore",
  shortName: "Folclore BR",
  locale: "pt-BR",
  brand: {
    title: "Uma Noite no Folclore",
    eyebrow: "UMA NOITE NO",
    name: "FOLCLORE",
    tagline: "O mato escuta · o Cruzeiro guarda · todo causo esconde alguém",
    description: "Dedução social entre assombrações e guardiões do folclore brasileiro.",
    shareText: "A mata chamou para Uma Noite no Folclore!\nSala {code}: {url}",
  },
  terminology: {
    center: "Cruzeiro",
    centerPositionNames: ["trilha esquerda", "pé da cruz", "trilha direita"],
    village: "aldeia",
    wolfPack: "uivo",
  },
  roles: {
    aldeao: { name: "Caboclo", letter: "C", description: "Dorme durante a ronda e tenta separar causo de pista ao amanhecer.", nightHint: "Feche os olhos, caboclo. Escute o mato e espere o galo.", artAlt: "Arte provisória do Caboclo" },
    lavrador: { name: "Turista", letter: "T", description: "Chegou com sinal ruim e certeza demais sobre toda lenda que recebeu no grupo.", nightHint: "Guarde o celular e espere o amanhecer.", artAlt: "Arte provisória do Turista" },
    cacador: { name: "Caipora", letter: "C", description: "Apaga uma trilha do Cruzeiro sem olhar o destino escondido.", nightHint: "Escolha uma trilha do Cruzeiro para esconder sem olhar.", artAlt: "Arte provisória da Caipora" },
    bruxa: { name: "Cuca", letter: "C", description: "Enxerga o destino de alguém e percebe quais trilhas ainda existem no Cruzeiro.", nightHint: "Espie uma pessoa e observe as trilhas do Cruzeiro.", artAlt: "Arte provisória da Cuca" },
    lobisomem: { name: "Lobisomem", letter: "L", description: "Reconhece os outros uivos e memoriza os destinos que sobraram no Cruzeiro.", nightHint: "Reconheça seu uivo e memorize o Cruzeiro.", artAlt: "Arte provisória do Lobisomem" },
    mumia: { name: "Saci", letter: "S", description: "Não age à noite; transforma o exorcismo em vitória se a aldeia o escolher.", nightHint: "Segure o redemoinho e espere a conversa.", artAlt: "Arte provisória do Saci" },
    esqueleto: { name: "Mula-sem-cabeça", letter: "M", description: "Não age à noite; vence se o ritual da aldeia cair sobre ela.", nightHint: "Apague o fogo e espere o amanhecer.", artAlt: "Arte provisória da Mula-sem-cabeça" },
    zumbi: { name: "Encantado", letter: "E", description: "Toma um destino do Cruzeiro, vira esse papel e pode executar sua ação.", nightHint: "Escolha um destino do Cruzeiro para assumir.", artAlt: "Arte provisória do Encantado" },
    vampiro: { name: "Boto", letter: "B", description: "Troca sua pele com alguém ou com um destino do Cruzeiro sem avisar.", nightHint: "Escolha com quem ou com qual destino trocar de pele.", artAlt: "Arte provisória do Boto" },
  },
  teams: {
    aliados: { name: "Guardiões", goal: "Descubram e expulsem o Lobisomem.", winBlurb: "Os guardiões leram os sinais da mata." },
    lobisomens: { name: "Uivo", goal: "Atravessem a votação sem serem expulsos.", winBlurb: "O uivo enganou a aldeia." },
    "mortos-vivos": { name: "Arteiros", goal: "Façam a aldeia escolher Saci ou Mula-sem-cabeça.", winBlurb: "O ritual virou combustível para a lenda." },
    zumbi: { name: "Encantado", goal: "Roube um destino; sua vitória vem do papel assumido.", winBlurb: "O Encantado vestiu outro destino." },
  },
  rulesCopy: {
    deckSummary: "Os mesmos nove destinos entram conforme o tamanho da roda; três sempre ficam no Cruzeiro.",
    intro: "Cada pessoa guarda um destino, e três caminhos ficam fechados no Cruzeiro.",
    voting: "Quando o galo cantar, contem os causos e escolham quem será expulso.",
    winPriority: "As lendas arteiras vencem se forem expulsas; os guardiões vencem ao achar o Lobisomem ou pela trilha da Caipora.",
  },
  narration: {
    ttsLocale: "pt-BR",
    segments: {
      intro: { narration: lines.intro },
      cacador: { narration: lines.cacador, actorPrompt: "Esconda uma trilha do Cruzeiro sem olhar." },
      bruxa: { narration: lines.bruxa, actorPrompt: "Espie uma pessoa e observe o Cruzeiro." },
      lobisomem: { narration: lines.lobisomem, actorPrompt: "Veja os outros uivos e memorize o Cruzeiro." },
      zumbi: { narration: lines.zumbi, actorPrompt: "Tome um destino e, se ele agir, faça sua ação." },
      vampiro: { narration: lines.vampiro, actorPrompt: "Troque sua pele com alguém ou com o Cruzeiro." },
      amanhecer: { narration: lines.amanhecer },
    },
    subtitles: buildNarrationSubtitles(lines),
  },
  ambient: { audioSrc: "/audio/background.mp3", volume: 0.14 },
  palette: {
    background: "#071f1a", backgroundSoft: "#123b2d", backgroundGlow: "#285c3f",
    surface: "#174b37", surfaceStrong: "#13281d", primary: "#9f2e24",
    primaryStrong: "#d04b31", accent: "#f0b44b", accentSoft: "#f6d37a",
    text: "#fff0c9", textMuted: "#c2b58f", border: "#04100c",
    positive: "#70bf62", danger: "#e44e3a",
  },
};

