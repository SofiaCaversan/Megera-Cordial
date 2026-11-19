import {
  buildUnifiedMoodboardLibrary,
  type CharacterId,
  type MoodboardItemInstance,
  type MoodboardLibraryItem,
} from '../utils/moodboardLogic';

export interface ActTrack {
  id: string;
  actNumber: 1 | 2 | 3;
  actCode: '01' | '02' | '03';
  actLabel: 'ATO 1' | 'ATO 2' | 'ATO 3';
  title: 'ATO 1' | 'ATO 2' | 'ATO 3';
  subtitle: string;
  oneLiner: string;
  durationLabel: string;
  durationSeconds: number;
  audioUrl: string;
  accentColor: string;
  secondaryColor: string;
  discTint: 'pink' | 'blue' | 'gold';
  synopsis: string;
  castFeatured: string[];
  themes: string[];
}

export const INITIAL_TRACKS: ActTrack[] = [
  {
    id: 'ato-01',
    actNumber: 1,
    actCode: '01',
    actLabel: 'ATO 1',
    title: 'ATO 1',
    subtitle: 'Inês, Margarida e os primeiros silêncios',
    oneLiner:
      'Após acordar em um hospital e ser encaminhada à terapia, Inês cruza seu caminho com Margarida e Daniel em meio a silêncios e perdas ainda sem nome.',
    durationLabel: "10'36\"",
    durationSeconds: 636,
    audioUrl: '/assets/aistudio/V3_MEGERA_CORDIAL_EP1_c548174d.mp3',
    accentColor: '#F8CCE1',
    secondaryColor: '#2071B8',
    discTint: 'pink',
    synopsis:
      'Após o fim de um relacionamento, Inês acorda em um hospital sem compreender exatamente o que a levou para essa situação. Ela é encaminhada para a terapia, embora esteja convencida de que não precisa. Enquanto isso, Margarida, a terapeuta da Inês, começa a refletir sobre a própria relação com o filho, Daniel, cuja distância emocional se torna cada vez mais evidente. Entre silêncios e conversas interrompidas, o episódio apresenta personagens que tentam lidar com perdas e mudanças que ainda não conseguem nomear.',
    castFeatured: ['Beatriz Santinelli (Inês)', 'Marina Meyer (Sara)', 'Silvia Marques (Margarida)', 'Gabriel Cersosimo (Daniel)'],
    themes: ['Despertar clínico', 'Ruptura amorosa', 'Maternidade contida'],
  },
  {
    id: 'ato-02',
    actNumber: 2,
    actCode: '02',
    actLabel: 'ATO 2',
    title: 'ATO 2',
    subtitle: 'Sara, Inês e a transferência afetiva',
    oneLiner:
      'Conflitos familiares, cobranças e mágoas vêm à tona, espelhando os dilemas entre pacientes e terapeutas.',
    durationLabel: "12'03\"",
    durationSeconds: 723,
    audioUrl: '/assets/aistudio/V2_MEGERA_CORDIAL_EP2_2d6213af.mp3',
    accentColor: '#2071B8',
    secondaryColor: '#E3CD32',
    discTint: 'blue',
    synopsis:
      'Ao ser questionada sobre a filha, Inês é levada a revisitar conflitos familiares que acreditava estarem resolvidos. Conforme relata suas lembranças e ressentimentos, surgem contradições que revelam uma relação marcada por cobranças, expectativas e mágoas acumuladas ao longo dos anos. Paralelamente, Margarida passa a enxergar aspectos da própria experiência na história de sua paciente, enquanto Daniel se vê confrontado por dilemas semelhantes através do acompanhamento de Sara, filha da Inês.',
    castFeatured: ['Marina Meyer (Sara)', 'Beatriz Santinelli (Inês)', 'Silvia Marques (Margarida)', 'Gabriel Cersosimo (Daniel)'],
    themes: ['Herdar em vida', 'Espelhamento', 'Escuta clínica'],
  },
  {
    id: 'ato-03',
    actNumber: 3,
    actCode: '03',
    actLabel: 'ATO 3',
    title: 'ATO 3',
    subtitle: 'Segredos familiares e rupturas',
    oneLiner:
      'A decisão de Daniel de deixar a clínica desencadeia segredos e confronta as expectativas entre mães, filhos e terapeutas.',
    durationLabel: "12'23\"",
    durationSeconds: 743,
    audioUrl: '/assets/aistudio/V1_MEGERA_CORDIAL_EP3_1672c2db.mp3',
    accentColor: '#E3CD32',
    secondaryColor: '#F8CCE1',
    discTint: 'gold',
    synopsis:
      'A intenção de Daniel de abandonar a profissão de psicoterapeuta desencadeia uma série de conflitos que já vinham se acumulando dentro da família. Ao mesmo tempo, Margarida encontra cada vez mais dificuldade para separar seus sentimentos pessoais do trabalho clínico, interferindo na relação construída com Inês. À medida que segredos, frustrações e expectativas vêm à tona, mães, filhos e terapeutas são obrigados a confrontar as expectativas que criaram uns com os outros.',
    castFeatured: ['Gabriel Cersosimo (Daniel)', 'Silvia Marques (Margarida)', 'Marina Meyer (Sara)', 'Beatriz Santinelli (Inês)'],
    themes: ['Filosofia e ruptura', 'Desejo versus dever', 'Desilusão'],
  },
];

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  age: number;
  archetype: string;
  voiceActor: string;
  voiceType: string;
  primaryColor: string;
  secondaryColor: string;
  textOnPrimary: string;
  cardNumber: string;
  traits: string[];
  psychology: string;
  monologueContext: string;
  monologue: string;
  keyMotifs: string[];
  defaultSilhouetteLabel: string;
}

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'ines',
    name: 'Inês',
    age: 62,
    archetype: 'Elegante e melancólica',
    voiceActor: 'Beatriz Santinelli',
    voiceType: 'Voz feminina madura',
    primaryColor: '#F8CCE1',
    secondaryColor: '#E3CD32',
    textOnPrimary: '#1A1A1A',
    cardNumber: 'MC-01 / MÃE DE SARA',
    traits: ['Tradicional', 'Melancólica', 'Desconfiada no amor'],
    psychology:
      'Inês é uma mulher elegante e melancólica, mãe da Sara. Criada sob valores tradicionais que moldaram sua visão amarga e desconfiada do amor. Sensível e emocionalmente contida, carrega um sentimento de solidão e frustração, vivendo em constante conflito entre o desejo de conexão e o medo de se entregar afetivamente. Sua relação com a filha, Sara, revela o choque entre uma mulher endurecida pelas decepções e alguém que ainda tenta acreditar na possibilidade do afeto.',
    monologueContext: 'No leito hospitalar · Mensagem para Fábio',
    monologue:
      '“Fábio, eu não acredito que você me deixou sozinha. Num hospital... Você sabe o que é acordar e perceber que ninguém veio? Como que isso sumiu tão rápido pra você?”',
    keyMotifs: ['Leito hospitalar', 'Aliança guardada', 'Xícara fria'],
    defaultSilhouetteLabel: 'Retrato de Inês',
  },
  {
    id: 'sara',
    name: 'Sara',
    age: 37,
    archetype: 'Observadora e contida',
    voiceActor: 'Marina Meyer',
    voiceType: 'Voz feminina jovem',
    primaryColor: '#2071B8',
    secondaryColor: '#E3CD32',
    textOnPrimary: '#FFFFFF',
    cardNumber: 'MC-02 / FILHA DE INÊS',
    traits: ['Observadora', 'Contida', 'Em busca de autonomia'],
    psychology:
      'Filha de Inês, observadora e emocionalmente contida. Vive uma relação difícil com a intimidade devido ao abandono do pai e ao vínculo turbulento com a mãe. Crítica e independente, mas ainda acredita no amor e tenta construir vínculos genuínos e uma vida diferente daquela em que cresceu.',
    monologueContext: 'Áudio para um amigo · Após a aula de culinária',
    monologue:
      '“Amigo, eu te falei que ele era um gato... só que às vezes parece que eu tô vivendo a vida dela por tabela. Não sei quando a casa deixou de ser minha, só acho que ainda é nossa.”',
    keyMotifs: ['Pavlova', 'Bloco de anotações', 'Chaves de casa'],
    defaultSilhouetteLabel: 'Retrato de Sara',
  },
  {
    id: 'margarida',
    name: 'Margarida',
    age: 67,
    archetype: 'Clínica e inflexível',
    voiceActor: 'Silvia Marques',
    voiceType: 'Voz feminina madura',
    primaryColor: '#A84B70',
    secondaryColor: '#C86D92',
    textOnPrimary: '#FFFFFF',
    cardNumber: 'MC-03 / PSICÓLOGA & MÃE',
    traits: ['Rígida', 'Bem-sucedida', 'Identidade apagada'],
    psychology:
      'Psicóloga e mãe de Daniel. Sente a própria identidade apagada pelas concessões e frustrações acumuladas ao longo do casamento. Embora seja uma boa profissional, fora do consultório tem dificuldade em lidar com os sentimentos e reações das pessoas próximas.',
    monologueContext: 'Ligação para Silvia · Entre consultas',
    monologue:
      '“Oi, Silvia! Sim, eu sei que a supervisão seria lá pra semana que vem... Mas se o enquadre não for respeitado, imagina se todo mundo decide fazer só o que bem entende, viramos o quê?”',
    keyMotifs: ['Relógio de pulso', 'Gravador clínico', 'Receituário'],
    defaultSilhouetteLabel: 'Retrato de Margarida',
  },
  {
    id: 'daniel',
    name: 'Daniel',
    age: 26,
    archetype: 'Introspectivo e inquieto',
    voiceActor: 'Gabriel Cersosimo',
    voiceType: 'Voz masculina jovem',
    primaryColor: '#E3CD32',
    secondaryColor: '#2071B8',
    textOnPrimary: '#1A1A1A',
    cardNumber: 'MC-04 / FILHO DE MARGARIDA',
    traits: ['Introspectivo', 'Filósofo', 'Em transição'],
    psychology:
      'Filho de Margarida, psicólogo no fim dos seus 20 anos. Vive uma constante sensação de inadequação profissional e pressão por expectativas. Sensível e introspectivo, evita conflitos, o que abala sua relação com a mãe e com o namorado, Rafael.',
    monologueContext: 'Ligação para o pai · Resultado do mestrado',
    monologue:
      '“Oi, Pai... eu passei. Eu tô animado! Sério, pela primeira vez em anos eu sinto que escolhi alguma coisa por mim. Só não conta pra ela por favor, deixa eu contar.”',
    keyMotifs: ['Livro de filosofia', 'Café preto', 'Bilhete de metrô'],
    defaultSilhouetteLabel: 'Retrato de Daniel',
  },
];

export interface ZinePageData {
  id: string;
  pageNumber: number;
  kind: 'cover' | 'editorial' | 'creators' | 'character-spread-left' | 'character-spread-right' | 'scene' | 'credits' | 'notes' | 'custom-image';
  bg: string;
  ink: string;
  accent: string;
  kicker: string;
  title: string;
  subtitle?: string;
  body?: string[];
  quote?: string;
  quoteAttribution?: string;
  characterId?: CharacterId;
  customImageUrl?: string;
  footerTag: string;
}

export const DEFAULT_ZINE_PAGES: ZinePageData[] = [
  {
    id: 'z-1',
    pageNumber: 1,
    kind: 'cover',
    bg: '#F8CCE1',
    ink: '#1A1A1A',
    accent: '#2071B8',
    kicker: 'ÁUDIO-FICÇÃO EM TRÊS ATOS · ZINE EDITORIAL',
    title: 'Megera Cordial',
    subtitle: 'Um projeto experimental em Audiovisual · Faculdade Cásper Líbero',
    body: [
      'A5 · 12 Páginas · Distribuição Física & Digital',
      'Por Isabelle Olvera e Sofia Caversan',
    ],
    footerTag: 'EDIÇÃO 01 · SÃO PAULO, 2026',
  },
  {
    id: 'z-2',
    pageNumber: 2,
    kind: 'editorial',
    bg: '#F7F5F0',
    ink: '#1A1A1A',
    accent: '#2071B8',
    kicker: 'PÁGINA 02 · SOBRE O PROJETO',
    title: 'A escuta como imagem',
    body: [
      'Megera Cordial nasceu do desejo de investigar a intimidade feminina e os ruídos familiares sem recorrer à literalidade da câmera. Inspirada livremente em "A Mulher Desiludida" de Simone de Beauvoir — especialmente nas tensões de "A Idade da Discrição" — a obra acompanha duas mães e dois filhos em colisão lenta.',
      'Concebido como um dispositivo híbrido entre três atos sonoros e este zine impresso, o projeto propõe que o leitor escute enquanto folheia fragmentos de consultório, recados telefônicos e objetos guardados.',
    ],
    quote: '“Não se trata de julgar quem permanece ou quem parte, mas de ouvir o instante exato em que o afeto vira expectativa.”',
    footerTag: 'FACULDADE CÁSPER LÍBERO · TCC AUDIOVISUAL',
  },
  {
    id: 'z-3',
    pageNumber: 3,
    kind: 'creators',
    bg: '#E3CD32',
    ink: '#1A1A1A',
    accent: '#2071B8',
    kicker: 'PÁGINA 03 · SOBRE AS CRIADORAS',
    title: 'Isabelle Olvera & Sofia Caversan',
    body: [
      'ISABELLE OLVERA — Entusiasta de cachorros e ocasionalmente cineasta. Formanda em Audiovisual pela Faculdade Cásper Líbero, atua como produtora executiva e em distribuição de projetos independentes. Em Megera Cordial assina direção, roteiro e produção executiva.',
      'SOFIA CAVERSAN — Designer deste zine e formanda em Audiovisual pela Faculdade Cásper Líbero. Vive entre o cinema, a cultura impressa e as imagens que despertam curiosidade. Assina direção, roteiro, produção e projeto gráfico.',
    ],
    footerTag: 'AUTORIA & REALIZAÇÃO',
  },
  {
    id: 'z-4',
    pageNumber: 4,
    kind: 'character-spread-left',
    bg: '#F8CCE1',
    ink: '#1A1A1A',
    accent: '#E3CD32',
    characterId: 'ines',
    kicker: 'PERSONAGEM 01 · FICHA PSICOLÓGICA',
    title: 'Inês',
    subtitle: 'Beatriz Santinelli · Mãe de Sara',
    body: [
      'Elegante, contida e atravessada pela melancolia. Criada sob a promessa de que a devoção doméstica garante permanência, Inês desperta em um hospital após a partida de Fábio sem conseguir traduzir o próprio colapso.',
      'Na terapia com Margarida, busca explicações para um abandono que recusa aceitar como definitivo.',
    ],
    footerTag: 'ATO I · II · III',
  },
  {
    id: 'z-5',
    pageNumber: 5,
    kind: 'character-spread-right',
    bg: '#F7F5F0',
    ink: '#1A1A1A',
    accent: '#F8CCE1',
    characterId: 'ines',
    kicker: 'FRAGMENTO DE VOZ · GRAVAÇÃO DE LEITO',
    title: 'Recado para Fábio',
    quote:
      '“Fábio, eu não acredito que você me deixou sozinha. Num hospital... Você sabe o que é acordar e perceber que ninguém veio? Como que isso sumiu tão rápido pra você?”',
    quoteAttribution: 'Inês · Ato I, cena 02',
    body: [
      'Objetos associados: pulseira hospitalar branca, lenço de linho dobrado, xícara de porcelana intocada.',
    ],
    footerTag: 'ARQUIVO DE ESCUTA 01',
  },
  {
    id: 'z-6',
    pageNumber: 6,
    kind: 'character-spread-left',
    bg: '#2071B8',
    ink: '#FFFFFF',
    accent: '#E3CD32',
    characterId: 'sara',
    kicker: 'PERSONAGEM 02 · FICHA PSICOLÓGICA',
    title: 'Sara',
    subtitle: 'Marina Meyer · Filha de Inês',
    body: [
      'Observadora e cautelosa, Sara aprendeu a ler o humor da casa antes de falar. Divide seus dias entre a responsabilidade pela recuperação da mãe e a tentativa de criar uma rotina própria.',
      'No consultório de Daniel, descobre que cuidar do outro também pode ser uma forma sutil de adiamento.',
    ],
    footerTag: 'ATO II · III',
  },
  {
    id: 'z-7',
    pageNumber: 7,
    kind: 'character-spread-right',
    bg: '#F7F5F0',
    ink: '#1A1A1A',
    accent: '#2071B8',
    characterId: 'sara',
    kicker: 'MENSAGEM DE ÁUDIO · CAMINHO DA COZINHA',
    title: 'Depois da aula',
    quote:
      '“Amigo, eu te falei que ele era um gato... só que às vezes parece que eu tô vivendo a vida dela por tabela. Não sei quando a casa deixou de ser minha, só acho que ainda é nossa.”',
    quoteAttribution: 'Sara · Ato II, nota de voz',
    body: [
      'Objetos associados: receita de pavlova manchada de açúcar, molho de chaves, caderno pautado.',
    ],
    footerTag: 'ARQUIVO DE ESCUTA 02',
  },
  {
    id: 'z-8',
    pageNumber: 8,
    kind: 'character-spread-left',
    bg: '#1A1A1A',
    ink: '#F7F5F0',
    accent: '#F8CCE1',
    characterId: 'margarida',
    kicker: 'PERSONAGEM 03 · FICHA PSICOLÓGICA',
    title: 'Margarida',
    subtitle: 'Silvia Marques · Psicóloga & Mãe de Daniel',
    body: [
      'Psicóloga bem-sucedida que construiu sua autoridade sobre o controle absoluto do método e do tempo. Ao atender Inês, percebe sua própria exigência maternal reverberar nas queixas da paciente.',
      'Entre uma supervisão e outra, teme perder a única certeza que ainda sustenta sua identidade: o controle sobre os seus.',
    ],
    footerTag: 'ATO I · II · III',
  },
  {
    id: 'z-9',
    pageNumber: 9,
    kind: 'character-spread-right',
    bg: '#E3CD32',
    ink: '#1A1A1A',
    accent: '#2071B8',
    characterId: 'daniel',
    kicker: 'PERSONAGEM 04 · FICHA & MONÓLOGO',
    title: 'Daniel',
    subtitle: 'Gabriel Cersosimo · Filho de Margarida',
    body: [
      'Introspectivo e inquieto, Daniel escolheu o mestrado em filosofia como quem abre uma janela num quarto fechado. Precisa contar à mãe antes que o segredo se torne uma acusação.',
    ],
    quote: '“Oi, Pai... eu passei. Eu tô animado! Só não conta pra ela por favor, deixa eu contar.”',
    quoteAttribution: 'Daniel · Ato III, telefonema',
    footerTag: 'ARQUIVO DE ESCUTA 03–04',
  },
  {
    id: 'z-10',
    pageNumber: 10,
    kind: 'scene',
    bg: '#F7F5F0',
    ink: '#1A1A1A',
    accent: '#2071B8',
    kicker: 'PÁGINA 10 · PLANTA DO CONSULTÓRIO',
    title: 'Espaço de escuta e espelho',
    body: [
      'Duas poltronas separadas por uma mesa baixa de vidro, um relógio de parede cujo ponteiro marca quarenta e cinco minutos exatos e uma janela voltada para o pátio interno.',
      'A áudio-ficção constrói toda a arquitetura espacial por meio de ressonâncias de sala, ruídos de papel, copos d’água e cliques discretos do gravador.',
    ],
    footerTag: 'DESENHO DE SOM · G. S. NEVES',
  },
  {
    id: 'z-11',
    pageNumber: 11,
    kind: 'credits',
    bg: '#2071B8',
    ink: '#FFFFFF',
    accent: '#E3CD32',
    kicker: 'PÁGINA 11 · FICHA TÉCNICA COMPLETA',
    title: 'Créditos de Produção',
    body: [
      'Direção e Roteiro: Isabelle Olvera e Sofia Caversan',
      'Orientação Acadêmica: Prof. Dra. Sabina Anzuategui',
      'Elenco Principal: Beatriz Santinelli (Inês), Gabriel Cersosimo (Daniel), Marina Meyer (Sara), Silvia Marques (Margarida)',
      'Elenco de Apoio: Artur Avelhanedo, Bruno Yahn, Felipe Beli, Maria Eduarda Novais, Pedro Mel Bardini, Rafaela Navarro, Roberto D’Ugo, Sabina Anzuategui, Vitor Fadul',
      'Edição de Som e Mixagem: G. S. Neves · Projeto Gráfico: Sofia Caversan',
    ],
    footerTag: 'FACULDADE CÁSPER LÍBERO · 2026',
  },
  {
    id: 'z-12',
    pageNumber: 12,
    kind: 'notes',
    bg: '#F8CCE1',
    ink: '#1A1A1A',
    accent: '#1A1A1A',
    kicker: 'CONTRACAPA · ANOTAÇÕES DE RAFA & DISTRIBUIÇÃO',
    title: 'Ouça na ordem que preferir',
    body: [
      '“Se alguma voz parecer familiar demais, não tente corrigir o volume — talvez seja só a sala devolvendo o eco de outra conversa.” — Nota de margem, Rafa.',
      'Distribuição independente em CD físico, zine impresso A5 e plataforma digital interativa Megera Cordial.',
    ],
    footerTag: 'MEGERA CORDIAL · FIM DO ZINE',
  },
];

export interface MoodboardUploadSlot {
  slotId: string;
  slotCode: string;
  uploadedUrl?: string;
  uploadedName?: string;
}

export const INITIAL_UPLOAD_SLOTS: MoodboardUploadSlot[] = [
  { slotId: 'slot-01', slotCode: '01' },
  { slotId: 'slot-02', slotCode: '02' },
  { slotId: 'slot-03', slotCode: '03' },
  { slotId: 'slot-04', slotCode: '04' },
  { slotId: 'slot-05', slotCode: '05' },
  { slotId: 'slot-06', slotCode: '06' },
];

export const UNIFIED_MOODBOARD_LIBRARY: MoodboardLibraryItem[] = buildUnifiedMoodboardLibrary(63, 2);

export const INITIAL_BOARD_PRESETS: Record<CharacterId, MoodboardItemInstance[]> = {
  ines: [],
  sara: [],
  margarida: [],
  daniel: [],
};

export const FULL_CREDITS = {
  obra: {
    title: 'Megera Cordial',
    tagline: 'Áudio-ficção em três atos & zine impresso experimental',
    inspiration:
      '“Megera Cordial” é uma história que não esperávamos contar. Ela se transformou, em uma tentativa de adaptação do conto “A Idade da Discrição” da Simone Beauvoir mas, ao longo da escrita, personagens foram nascendo, outros se transformaram e perdemos o controle daquela história. É curiosa a primeira perda da história, a morte da primeira ideia e o nascimento de uma coisa completamente nova.',
    methodology:
      'As autoras desenvolveram uma áudio ficção, ou radionovela, como são obrigadas a comparar para entendimento geral, e um zine (este que você lê), “que é como uma revistinha”. A escolha de duas materializações não foi apenas para contrariar o modelo tradicional, mas foi pensada de maneira a exercitar a imaginação e a reflexão referente à narrativa.',
  },
  creators: [
    {
      name: 'Isabelle Olvera',
      role: 'Direção, Roteiro e Produção Executiva',
      photoUrl: '/assets/aistudio/1.png',
      bio: 'Entusiasta de cachorros e ocasionalmente cineasta. Formanda em Audiovisual pela Faculdade Cásper Líbero, Atua como produtora executiva e em distribuição de projetos independentes. Interessada em estudos sobre relacionamentos humanos, principalmente amorosos, e histórias de fantasma.',
      accent: '#F8CCE1',
    },
    {
      name: 'Sofia Caversan',
      role: 'Direção, Roteiro, Produção e Design do Zine',
      photoUrl: '/assets/aistudio/2.png',
      bio: 'Designer da zine e desse site que você está acessando, formanda em Audiovisual pela Faculdade Cásper Líbero. Vivo entre o cinema, a cultura e as imagens que me despertam curiosidade. Gosto de fotografar, principalmente grades que encontro por aí.',
      accent: '#E3CD32',
    },
  ],
  mainCast: [
    { character: 'Inês', actor: 'Beatriz Santinelli', color: '#F8CCE1' },
    { character: 'Sara', actor: 'Marina Meyer', color: '#2071B8' },
    { character: 'Margarida', actor: 'Silvia Marques', color: '#2071B8' },
    { character: 'Daniel', actor: 'Gabriel Cersosimo', color: '#E3CD32' },
  ],
  supportingCast: [
    'Artur Avelhanedo',
    'Bruno Yahn',
    'Felipe Beli',
    'Maria Eduarda Novais',
    'Pedro Mel Bardini',
    'Rafaela Navarro',
    'Roberto D’Ugo',
    'Sabina Anzuategui',
    'Vitor Fadul',
  ],
  crew: [
    { role: 'Edição de Som e Mixagem', name: 'G. S. Neves' },
    { role: 'Orientação Acadêmica (TCC)', name: 'Prof. Dra. Sabina Anzuategui' },
    { role: 'Projeto Gráfico & Zine A5', name: 'Sofia Caversan' },
    { role: 'Apoio Institucional', name: 'Faculdade Cásper Líbero (2026)' },
  ],
};
