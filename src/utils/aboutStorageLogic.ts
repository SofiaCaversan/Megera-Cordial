import { FULL_CREDITS } from '../data/projectData';

export const ABOUT_STORAGE_KEY = 'megera-cordial-about-v4';

export interface AboutCustomSection {
  id: string;
  title: string;
  body: string;
}

export interface AboutCreatorContent {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
  accent: string;
}

export interface AboutProjectParagraph {
  id: string;
  text: string;
}

export interface AboutTechCreditRow {
  id: string;
  label: string;
  value: string;
}

export interface AboutPageContent {
  showProjectSection: boolean;
  projectTitle: string;
  projectParagraphs: AboutProjectParagraph[];
  listenLabel: string;
  showAuthorsSection: boolean;
  authorsTitle: string;
  creators: AboutCreatorContent[];
  showTechSheetSection: boolean;
  techSheetTitle: string;
  techSheetRows: AboutTechCreditRow[];
  customSections: AboutCustomSection[];
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const OFFICIAL_ABOUT_PARAGRAPHS: AboutProjectParagraph[] = [
  {
    id: 'p-1',
    text: '“Megera Cordial” é uma história que não esperávamos contar. Ela se transformou, em uma tentativa de adaptação do conto “A Idade da Discrição” da Simone Beauvoir mas, ao longo da escrita, personagens foram nascendo, outros se transformaram e perdemos o controle daquela história. É curiosa a primeira perda da história, a morte da primeira ideia e o nascimento de uma coisa completamente nova.',
  },
  {
    id: 'p-2',
    text: 'As autoras desenvolveram uma áudio ficção, ou radionovela, como são obrigadas a comparar para entendimento geral, e um zine (este que você lê), “que é como uma revistinha”. A escolha de duas materializações não foi apenas para contrariar o modelo tradicional, mas foi pensada de maneira a exercitar a imaginação e a reflexão referente à narrativa.',
  },
  {
    id: 'p-3',
    text: 'Inês, Sara, Margarida e Daniel se confundem e entrelaçam nessa história. A narrativa nasce quando mãe e filha, Inês e Sara, iniciam terapia com Margarida e Daniel, que também são mãe e filho. As relações entre os personagens tensionam e afrouxam quando a relação entre os personagens serve como transferência para certas idealizações e conflitos.',
  },
];

export const OFFICIAL_TECH_SHEET_ROWS: AboutTechCreditRow[] = [
  {
    id: 'tech-direcao',
    label: 'Direção:',
    value: 'Isabelle Olvera e Sofia Caversan',
  },
  {
    id: 'tech-roteiro',
    label: 'Roteiro:',
    value: 'Isabelle Olvera e Sofia Caversan',
  },
  {
    id: 'tech-producao',
    label: 'Produção:',
    value: 'Isabelle Olvera e Sofia Caversan',
  },
  {
    id: 'tech-som',
    label: 'Edição de som e mixagem:',
    value: 'G. S. Neves',
  },
  {
    id: 'tech-elenco-principal',
    label: 'Elenco principal:',
    value: 'Beatriz Santinelli, Gabriel Cersosimo, Marina Meyer e Silvia Marques.',
  },
  {
    id: 'tech-elenco-apoio',
    label: 'Elenco de apoio:',
    value:
      "Artur Avelhanedo, Bruno Yahn, Felipe Beli, Maria Eduarda Novais, Pedro Mel Bardini, Rafaela Navarro, Roberto D'ugo, Sabina Anzuategui e Vitor Fadul.",
  },
  {
    id: 'tech-apoio',
    label: 'Apoio institucional:',
    value: 'Faculdade Cásper Líbero.',
  },
];

export function buildDefaultAboutContent(): AboutPageContent {
  return {
    showProjectSection: true,
    projectTitle: 'Megera Cordial',
    projectParagraphs: OFFICIAL_ABOUT_PARAGRAPHS.map((p) => ({ ...p })),
    listenLabel: 'Ouça a história completa:',
    showAuthorsSection: true,
    authorsTitle: 'Sobre as Autoras',
    creators: FULL_CREDITS.creators.map((c, idx) => ({
      id: `creator-${idx + 1}`,
      name: c.name,
      bio: c.bio,
      photoUrl: c.photoUrl,
      accent: c.accent,
    })),
    showTechSheetSection: true,
    techSheetTitle: 'Ficha Técnica',
    techSheetRows: OFFICIAL_TECH_SHEET_ROWS.map((r) => ({ ...r })),
    customSections: [],
  };
}

const LEGACY_ABOUT_STORAGE_KEYS = [
  'megera-cordial-about-v1',
  'megera-cordial-about-v2',
  'megera-cordial-about-v3',
];

const PREVIOUS_SOFIA_BIOS = new Set([
  'Designer dessa zine que você está lendo e formanda em Audiovisual pela Faculdade Cásper Líbero. Vivo entre o cinema, a cultura e as imagens que me despertam curiosidade. Gosto de fotografar, principalmente grades que encontro por aí.',
  'Designer da zine e desse site que você está acessando e formanda em Audiovisual pela Faculdade Cásper Líbero. Vivo entre o cinema, a cultura e as imagens que me despertam curiosidade. Gosto de fotografar, principalmente grades que encontro por aí.',
]);

export function loadAboutContent(storage?: StorageLike | null): AboutPageContent {
  const defaults = buildDefaultAboutContent();
  if (!storage) return defaults;

  for (const legacyKey of LEGACY_ABOUT_STORAGE_KEYS) {
    try {
      storage.removeItem(legacyKey);
    } catch {
      // Ignore cleanup errors
    }
  }

  try {
    const raw = storage.getItem(ABOUT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AboutPageContent>;
    if (!parsed || typeof parsed !== 'object') return defaults;

    let migratedLegacySofiaBio = false;
    const creators = Array.isArray(parsed.creators)
      ? parsed.creators.map((c, idx) => {
          const defaultCreator = defaults.creators[idx];
          const isSofia = c.id === 'creator-2' || c.name === 'Sofia Caversan';
          const shouldReplaceSofiaBio =
            isSofia && typeof c.bio === 'string' && PREVIOUS_SOFIA_BIOS.has(c.bio.trim());
          if (shouldReplaceSofiaBio) {
            migratedLegacySofiaBio = true;
          }
          const rawPhoto = typeof c.photoUrl === 'string' ? c.photoUrl.trim() : '';
          const isValidPhoto =
            rawPhoto.startsWith('/assets/aistudio/') ||
            rawPhoto.startsWith('data:') ||
            rawPhoto.startsWith('blob:');
          return {
            ...defaultCreator,
            ...c,
            bio: shouldReplaceSofiaBio
              ? defaults.creators[1]?.bio || c.bio
              : c.bio ?? defaultCreator?.bio ?? '',
            photoUrl: isValidPhoto ? rawPhoto : defaultCreator?.photoUrl || '/assets/aistudio/1.png',
          };
        })
      : defaults.creators;

    const normalized: AboutPageContent = {
      ...defaults,
      ...parsed,
      showProjectSection:
        typeof parsed.showProjectSection === 'boolean' ? parsed.showProjectSection : defaults.showProjectSection,
      showAuthorsSection:
        typeof parsed.showAuthorsSection === 'boolean' ? parsed.showAuthorsSection : defaults.showAuthorsSection,
      showTechSheetSection:
        typeof parsed.showTechSheetSection === 'boolean'
          ? parsed.showTechSheetSection
          : defaults.showTechSheetSection,
      projectParagraphs: Array.isArray(parsed.projectParagraphs)
        ? parsed.projectParagraphs
        : defaults.projectParagraphs,
      creators,
      techSheetRows: Array.isArray(parsed.techSheetRows) ? parsed.techSheetRows : defaults.techSheetRows,
      customSections: Array.isArray(parsed.customSections) ? parsed.customSections : [],
    };

    if (migratedLegacySofiaBio) {
      saveAboutContent(storage, normalized);
    }

    return normalized;
  } catch {
    return defaults;
  }
}

export function saveAboutContent(storage: StorageLike | null | undefined, content: AboutPageContent): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(content));
    return true;
  } catch {
    return false;
  }
}

export function resetAboutContent(storage?: StorageLike | null): AboutPageContent {
  if (storage) {
    try {
      storage.removeItem(ABOUT_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
  }
  return buildDefaultAboutContent();
}

export function removeProjectParagraph(content: AboutPageContent, paragraphId: string): AboutPageContent {
  return {
    ...content,
    projectParagraphs: content.projectParagraphs.filter((p) => p.id !== paragraphId),
  };
}

export function removeCreatorBlock(content: AboutPageContent, creatorId: string): AboutPageContent {
  const remaining = content.creators.filter((c) => c.id !== creatorId);
  return {
    ...content,
    creators: remaining,
    showAuthorsSection: remaining.length > 0 ? content.showAuthorsSection : false,
  };
}

export function removeTechSheetRow(content: AboutPageContent, rowId: string): AboutPageContent {
  const remaining = content.techSheetRows.filter((r) => r.id !== rowId);
  return {
    ...content,
    techSheetRows: remaining,
    showTechSheetSection: remaining.length > 0 ? content.showTechSheetSection : false,
  };
}

export function addCustomAboutSection(content: AboutPageContent): AboutPageContent {
  const newSection: AboutCustomSection = {
    id: `custom-block-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: 'Novo Bloco',
    body: 'Clique aqui para escrever notas, agradecimentos ou novas informações sobre o projeto.',
  };

  return {
    ...content,
    customSections: [...content.customSections, newSection],
  };
}

export function removeCustomAboutSection(
  content: AboutPageContent,
  sectionId: string
): AboutPageContent {
  return {
    ...content,
    customSections: content.customSections.filter((s) => s.id !== sectionId),
  };
}
