import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ABOUT_STORAGE_KEY,
  OFFICIAL_ABOUT_PARAGRAPHS,
  OFFICIAL_TECH_SHEET_ROWS,
  addCustomAboutSection,
  buildDefaultAboutContent,
  loadAboutContent,
  removeCreatorBlock,
  removeCustomAboutSection,
  removeProjectParagraph,
  removeTechSheetRow,
  resetAboutContent,
  saveAboutContent,
  type StorageLike,
} from './aboutStorageLogic';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

test('loadAboutContent returns verbatim official texts, authors, and Ficha Técnica when storage is empty or corrupted', () => {
  const mem = createMemoryStorage();
  const initial = loadAboutContent(mem);
  assert.equal(initial.projectTitle, 'Megera Cordial');
  assert.equal(initial.authorsTitle, 'Sobre as Autoras');
  assert.equal(initial.techSheetTitle, 'Ficha Técnica');
  assert.equal(initial.projectParagraphs.length, 3);
  assert.equal(initial.projectParagraphs[0].text, OFFICIAL_ABOUT_PARAGRAPHS[0].text);
  assert.equal(initial.projectParagraphs[1].text, OFFICIAL_ABOUT_PARAGRAPHS[1].text);
  assert.equal(initial.projectParagraphs[2].text, OFFICIAL_ABOUT_PARAGRAPHS[2].text);
  assert.equal(initial.listenLabel, 'Ouça a história completa:');
  assert.equal(initial.creators.length, 2);
  assert.equal(
    initial.creators[0].bio,
    'Entusiasta de cachorros e ocasionalmente cineasta. Formanda em Audiovisual pela Faculdade Cásper Líbero, Atua como produtora executiva e em distribuição de projetos independentes. Interessada em estudos sobre relacionamentos humanos, principalmente amorosos, e histórias de fantasma.'
  );
  assert.equal(
    initial.creators[1].bio,
    'Designer da zine e desse site que você está acessando, formanda em Audiovisual pela Faculdade Cásper Líbero. Vivo entre o cinema, a cultura e as imagens que me despertam curiosidade. Gosto de fotografar, principalmente grades que encontro por aí.'
  );
  assert.equal(initial.techSheetRows.length, 7);
  assert.equal(initial.techSheetRows[3].value, 'G. S. Neves');
  assert.equal(initial.techSheetRows[5].value.includes("Roberto D'ugo"), true);
  assert.equal(initial.customSections.length, 0);

  // Legacy Sofia bio saved in storage should be migrated/cleared cleanly
  const stale = buildDefaultAboutContent();
  stale.creators[1].bio =
    'Designer da zine e desse site que você está acessando e formanda em Audiovisual pela Faculdade Cásper Líbero. Vivo entre o cinema, a cultura e as imagens que me despertam curiosidade. Gosto de fotografar, principalmente grades que encontro por aí.';
  mem.setItem(ABOUT_STORAGE_KEY, JSON.stringify(stale));
  mem.setItem('megera-cordial-about-v3', '{"legacy":true}');
  const migrated = loadAboutContent(mem);
  assert.equal(
    migrated.creators[1].bio,
    'Designer da zine e desse site que você está acessando, formanda em Audiovisual pela Faculdade Cásper Líbero. Vivo entre o cinema, a cultura e as imagens que me despertam curiosidade. Gosto de fotografar, principalmente grades que encontro por aí.'
  );
  assert.equal(mem.getItem('megera-cordial-about-v3'), null);

  mem.setItem(ABOUT_STORAGE_KEY, '{bad-json');
  const fallback = loadAboutContent(mem);
  assert.equal(fallback.projectTitle, 'Megera Cordial');
  assert.equal(fallback.techSheetRows.length, OFFICIAL_TECH_SHEET_ROWS.length);
});

test('saveAboutContent persists edited texts and resetAboutContent restores defaults', () => {
  const mem = createMemoryStorage();
  const content = buildDefaultAboutContent();
  content.projectTitle = 'Megera Cordial — Edição Comentada';
  content.projectParagraphs[0].text = 'Texto editado no navegador.';
  content.techSheetRows[0].value = 'Isabelle Olvera & Sofia Caversan';

  assert.equal(saveAboutContent(mem, content), true);
  const reloaded = loadAboutContent(mem);
  assert.equal(reloaded.projectTitle, 'Megera Cordial — Edição Comentada');
  assert.equal(reloaded.projectParagraphs[0].text, 'Texto editado no navegador.');
  assert.equal(reloaded.techSheetRows[0].value, 'Isabelle Olvera & Sofia Caversan');

  const reset = resetAboutContent(mem);
  assert.equal(reset.projectTitle, 'Megera Cordial');
  assert.equal(reset.projectParagraphs[0].text, OFFICIAL_ABOUT_PARAGRAPHS[0].text);
  assert.equal(reset.techSheetRows[0].value, 'Isabelle Olvera e Sofia Caversan');
  assert.equal(mem.getItem(ABOUT_STORAGE_KEY), null);
});

test('block removal and addition helpers update paragraphs, creators, tech sheet rows, and custom blocks cleanly', () => {
  const base = buildDefaultAboutContent();

  const afterRemovePara = removeProjectParagraph(base, 'p-2');
  assert.equal(afterRemovePara.projectParagraphs.length, 2);
  assert.equal(afterRemovePara.projectParagraphs.some((p) => p.id === 'p-2'), false);

  const afterRemoveCreator1 = removeCreatorBlock(afterRemovePara, 'creator-1');
  assert.equal(afterRemoveCreator1.creators.length, 1);
  assert.equal(afterRemoveCreator1.showAuthorsSection, true);

  const afterRemoveCreator2 = removeCreatorBlock(afterRemoveCreator1, 'creator-2');
  assert.equal(afterRemoveCreator2.creators.length, 0);
  assert.equal(afterRemoveCreator2.showAuthorsSection, false);

  const afterRemoveTech = removeTechSheetRow(base, 'tech-som');
  assert.equal(afterRemoveTech.techSheetRows.length, 6);
  assert.equal(afterRemoveTech.showTechSheetSection, true);

  const withOne = addCustomAboutSection(base);
  assert.equal(withOne.customSections.length, 1);
  assert.equal(withOne.customSections[0].title, 'Novo Bloco');

  const withTwo = addCustomAboutSection(withOne);
  assert.equal(withTwo.customSections.length, 2);

  const removed = removeCustomAboutSection(withTwo, withOne.customSections[0].id);
  assert.equal(removed.customSections.length, 1);
  assert.equal(removed.customSections[0].id, withTwo.customSections[1].id);
});
