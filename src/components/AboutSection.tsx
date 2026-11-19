import React, { useEffect, useRef, useState } from 'react';
import { Disc3, Plus, RotateCcw, Save, Check } from 'lucide-react';
import {
  ABOUT_STORAGE_KEY,
  addCustomAboutSection,
  buildDefaultAboutContent,
  loadAboutContent,
  removeCreatorBlock,
  removeCustomAboutSection,
  removeProjectParagraph,
  removeTechSheetRow,
  resetAboutContent,
  saveAboutContent,
  type AboutPageContent,
} from '../utils/aboutStorageLogic';

interface AboutSectionProps {
  isAdmin: boolean;
  onNavigateTab: (tab: 'player' | 'zine' | 'characters') => void;
}

interface EditableTextProps {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'dt' | 'dd';
  value: string;
  editable: boolean;
  resetVersion: number;
  onCommit: (nextValue: string) => void;
  className?: string;
  editableTone?: 'light' | 'dark';
  style?: React.CSSProperties;
  id?: string;
  testId?: string;
  ariaLabel?: string;
}

const EditableText: React.FC<EditableTextProps> = ({
  as = 'p',
  value,
  editable,
  resetVersion,
  onCommit,
  className = '',
  editableTone = 'light',
  style,
  id,
  testId,
  ariaLabel,
}) => {
  const elRef = useRef<HTMLElement | null>(null);
  const initialSeedRef = useRef<string>(value);

  useEffect(() => {
    initialSeedRef.current = value;
    if (elRef.current && document.activeElement !== elRef.current) {
      elRef.current.textContent = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetVersion, editable]);

  const handleSync = (el: HTMLElement) => {
    if (!editable) return;
    const next = el.innerText.replace(/\r\n/g, '\n');
    onCommit(next);
  };

  const Tag = as as React.ElementType;

  if (!editable) {
    return (
      <Tag id={id} data-testid={testId} style={style} className={`whitespace-pre-wrap ${className}`}>
        {value}
      </Tag>
    );
  }

  const editableHoverClass =
    editableTone === 'dark'
      ? 'hover:bg-white/15 hover:outline-1 hover:outline-dashed hover:outline-[#E3CD32] focus:bg-white/18 focus:outline-2 focus:outline-dashed focus:outline-[#E3CD32]'
      : 'hover:bg-[#F8CCE1]/22 hover:outline-1 hover:outline-dashed hover:outline-[#2071B8]/45 focus:bg-[#F8CCE1]/25 focus:outline-2 focus:outline-dashed focus:outline-[#2071B8]';

  return (
    <Tag
      ref={elRef}
      id={id}
      data-testid={testId}
      aria-label={ariaLabel}
      contentEditable="true"
      suppressContentEditableWarning
      style={style}
      onInput={(e: React.FormEvent<HTMLElement>) => handleSync(e.currentTarget)}
      onBlur={(e: React.FocusEvent<HTMLElement>) => handleSync(e.currentTarget)}
      className={`cursor-text rounded-xs px-0.5 -mx-0.5 transition-colors whitespace-pre-wrap ${editableHoverClass} ${className}`}
    >
      {initialSeedRef.current}
    </Tag>
  );
};

export const AboutSection: React.FC<AboutSectionProps> = ({ isAdmin, onNavigateTab }) => {
  const [content, setContent] = useState<AboutPageContent>(() =>
    isAdmin && typeof window !== 'undefined'
      ? loadAboutContent(window.localStorage)
      : buildDefaultAboutContent()
  );
  const [resetVersion, setResetVersion] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Edição direta ativa · salvo automaticamente');

  useEffect(() => {
    if (isAdmin && typeof window !== 'undefined') {
      setContent(loadAboutContent(window.localStorage));
    } else {
      setContent(buildDefaultAboutContent());
    }
    setResetVersion((v) => v + 1);
  }, [isAdmin]);

  const commitChange = (updater: (prev: AboutPageContent) => AboutPageContent) => {
    if (!isAdmin) return;
    setContent((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        saveAboutContent(window.localStorage, next);
      }
      return next;
    });
    setStatusMessage('Alteração salva no navegador');
  };

  const handleManualSave = () => {
    if (!isAdmin) return;
    if (typeof window !== 'undefined') {
      saveAboutContent(window.localStorage, content);
      try {
        window.localStorage.setItem(`${ABOUT_STORAGE_KEY}:savedAt`, new Date().toISOString());
      } catch {
        // Ignore optional timestamp key error
      }
    }
    setStatusMessage('Alterações salvas!');
  };

  const handleRestoreDefaults = () => {
    if (!isAdmin) return;
    const defaults = resetAboutContent(typeof window !== 'undefined' ? window.localStorage : null);
    setContent(defaults);
    setResetVersion((v) => v + 1);
    setStatusMessage('Textos originais restaurados');
  };

  const handleAddSection = () => {
    if (!isAdmin) return;
    commitChange((prev) => addCustomAboutSection(prev));
    setStatusMessage('Novo bloco adicionado e salvo');
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!isAdmin) return;
    commitChange((prev) => removeCustomAboutSection(prev, sectionId));
    setStatusMessage('Bloco removido');
  };

  return (
    <section aria-labelledby="about-heading" className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24 space-y-10">
      {/* Admin-Only Controls Bar */}
      {isAdmin && (
        <div
          data-testid="about-admin-toolbar"
          className="flex flex-wrap items-center justify-between gap-3 border border-[#1A1A1A]/25 bg-white/95 px-3 py-2 shadow-[3px_3px_0_#1A1A1A]"
        >
          <span
            data-testid="about-save-status"
            className="inline-flex items-center gap-1.5 font-mono-ui text-[11px] text-[#5C5952]"
          >
            <Check className="w-3.5 h-3.5 text-[#2071B8]" />
            <span>{statusMessage}</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="about-save-btn"
              onClick={handleManualSave}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono-ui border border-[#1A1A1A]/25 bg-white text-[#1A1A1A] hover:bg-[#E3CD32]/50 transition-colors cursor-pointer"
            >
              <Save className="w-3 h-3 text-[#2071B8]" />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              data-testid="about-restore-btn"
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono-ui border border-[#1A1A1A]/25 bg-white text-[#5C5952] hover:text-[#1A1A1A] hover:bg-[#F8CCE1]/40 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar</span>
            </button>
            <button
              type="button"
              data-testid="add-about-section-btn"
              onClick={handleAddSection}
              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-mono-ui border border-[#1A1A1A] bg-[#E3CD32] hover:bg-[#edd946] text-[#1A1A1A] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Bloco</span>
            </button>
          </div>
        </div>
      )}

      {/* Official Project Text Block */}
      {content.showProjectSection && (
        <article
          data-testid="about-project-block"
          className="border border-[#1A1A1A] bg-white p-6 sm:p-9 space-y-6 shadow-[6px_6px_0_#1A1A1A]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#1A1A1A]/15 pb-4">
            <EditableText
              as="h1"
              id="about-heading"
              testId="about-main-title"
              editable={isAdmin}
              value={content.projectTitle}
              resetVersion={resetVersion}
              onCommit={(val) => commitChange((prev) => ({ ...prev, projectTitle: val }))}
              className="font-script text-5xl sm:text-6xl text-[#1A1A1A] leading-none"
              ariaLabel="Editar título do projeto"
            />

            {isAdmin && (
              <button
                type="button"
                data-testid="remove-about-project-btn"
                onClick={() =>
                  commitChange((prev) => ({ ...prev, showProjectSection: false }))
                }
                className="shrink-0 px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A]/30 text-[#5C5952] hover:bg-red-50 hover:text-red-700 cursor-pointer"
              >
                ✕ Remover bloco
              </button>
            )}
          </div>

          <div className="space-y-5">
            {content.projectParagraphs.map((paragraph, idx) => (
              <div
                key={paragraph.id}
                data-testid={`about-project-paragraph-${paragraph.id}`}
                className="group relative flex items-start justify-between gap-3"
              >
                <EditableText
                  as="p"
                  testId={`about-obra-paragraph-${idx + 1}`}
                  editable={isAdmin}
                  value={paragraph.text}
                  resetVersion={resetVersion}
                  onCommit={(val) =>
                    commitChange((prev) => ({
                      ...prev,
                      projectParagraphs: prev.projectParagraphs.map((p) =>
                        p.id === paragraph.id ? { ...p, text: val } : p
                      ),
                    }))
                  }
                  className="flex-1 font-vintage text-[16px] sm:text-[17px] leading-[1.78] text-[#1A1A1A]"
                  ariaLabel={`Editar parágrafo ${idx + 1} do texto oficial`}
                />
                {isAdmin && (
                  <button
                    type="button"
                    data-testid={`remove-paragraph-${paragraph.id}`}
                    onClick={() =>
                      commitChange((prev) => removeProjectParagraph(prev, paragraph.id))
                    }
                    className="shrink-0 px-2 py-0.5 text-[10px] font-mono-ui border border-[#1A1A1A]/25 text-[#5C5952] hover:bg-red-50 hover:text-red-700 cursor-pointer"
                  >
                    ✕ Remover bloco
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#1A1A1A]/15 flex flex-wrap items-center gap-3">
            <EditableText
              as="span"
              testId="about-listen-label"
              editable={isAdmin}
              value={content.listenLabel}
              resetVersion={resetVersion}
              onCommit={(val) => commitChange((prev) => ({ ...prev, listenLabel: val }))}
              className="font-vintage text-[16px] text-[#1A1A1A]"
              ariaLabel="Editar chamada para ouvir a história"
            />
            <button
              type="button"
              data-testid="about-listen-cta"
              onClick={() => onNavigateTab('player')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono-ui border border-[#1A1A1A] bg-[#F8CCE1] hover:bg-[#f5bdd8] text-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] cursor-pointer transition-colors"
            >
              <Disc3 className="w-4 h-4 text-[#2071B8]" />
              <span>Ouvir os 3 Atos</span>
            </button>
          </div>
        </article>
      )}

      {/* Sobre as Autoras Block — Clean Solid #2071B8 Blue */}
      {content.showAuthorsSection && (
        <section
          data-testid="about-authors-block"
          className="relative bg-[#2071B8] border border-[#1A1A1A] p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/30 pb-3">
            <EditableText
              as="h2"
              id={!content.showProjectSection ? 'about-heading' : undefined}
              testId="about-authors-title"
              editable={isAdmin}
              editableTone="dark"
              value={content.authorsTitle}
              resetVersion={resetVersion}
              onCommit={(val) => commitChange((prev) => ({ ...prev, authorsTitle: val }))}
              className="font-script text-4xl sm:text-5xl text-[#E3CD32] leading-none"
              ariaLabel="Editar título da seção Sobre as Autoras"
            />
            {isAdmin && (
              <button
                type="button"
                data-testid="remove-about-authors-btn"
                onClick={() =>
                  commitChange((prev) => ({ ...prev, showAuthorsSection: false }))
                }
                className="shrink-0 px-2 py-1 text-[10px] font-mono-ui border border-white/55 text-white hover:bg-[#E3CD32] hover:text-[#1A1A1A] cursor-pointer transition-colors"
              >
                ✕ Remover bloco
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.creators.map((creator) => (
              <article
                key={creator.id}
                data-testid={`creator-card-${creator.id}`}
                className="bg-[#2071B8] border border-[#E3CD32]/85 p-5 sm:p-6 flex flex-col justify-between gap-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
                    {/* Clean Author Portrait without borders */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 relative overflow-hidden">
                      <img
                        src={creator.photoUrl}
                        alt={`Retrato de ${creator.name}`}
                        data-testid={`creator-photo-${creator.id}`}
                        className="w-full h-full object-cover grayscale contrast-115 block"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <EditableText
                        as="h3"
                        editable={isAdmin}
                        editableTone="dark"
                        value={creator.name}
                        resetVersion={resetVersion}
                        onCommit={(val) =>
                          commitChange((prev) => ({
                            ...prev,
                            creators: prev.creators.map((c) =>
                              c.id === creator.id ? { ...c, name: val } : c
                            ),
                          }))
                        }
                        className="font-script text-4xl sm:text-[42px] text-[#E3CD32] leading-none"
                        ariaLabel={`Editar nome ${creator.name}`}
                      />
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      data-testid={`remove-creator-${creator.id}`}
                      onClick={() =>
                        commitChange((prev) => removeCreatorBlock(prev, creator.id))
                      }
                      className="shrink-0 px-2 py-0.5 text-[10px] font-mono-ui border border-white/50 text-white hover:bg-[#E3CD32] hover:text-[#1A1A1A] cursor-pointer transition-colors"
                    >
                      ✕ Remover bloco
                    </button>
                  )}
                </div>

                <EditableText
                  as="p"
                  testId={`creator-bio-${creator.id}`}
                  editable={isAdmin}
                  editableTone="dark"
                  value={creator.bio}
                  resetVersion={resetVersion}
                  onCommit={(val) =>
                    commitChange((prev) => ({
                      ...prev,
                      creators: prev.creators.map((c) =>
                        c.id === creator.id ? { ...c, bio: val } : c
                      ),
                    }))
                  }
                  className="font-vintage text-[14.5px] leading-[1.74] text-white"
                  ariaLabel={`Editar biografia de ${creator.name}`}
                />
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Official Ficha Técnica Editorial Block */}
      {content.showTechSheetSection && (
        <article
          data-testid="about-tech-sheet-block"
          className="border border-[#1A1A1A] bg-white p-6 sm:p-9 space-y-5 shadow-[6px_6px_0_#1A1A1A]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#1A1A1A]/15 pb-3.5">
            <EditableText
              as="h2"
              testId="about-tech-sheet-title"
              editable={isAdmin}
              value={content.techSheetTitle}
              resetVersion={resetVersion}
              onCommit={(val) => commitChange((prev) => ({ ...prev, techSheetTitle: val }))}
              className="font-script text-4xl sm:text-5xl text-[#1A1A1A] leading-none"
              ariaLabel="Editar título da Ficha Técnica"
            />

            {isAdmin && (
              <button
                type="button"
                data-testid="remove-about-tech-sheet-btn"
                onClick={() =>
                  commitChange((prev) => ({ ...prev, showTechSheetSection: false }))
                }
                className="shrink-0 px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A]/30 text-[#5C5952] hover:bg-red-50 hover:text-red-700 cursor-pointer"
              >
                ✕ Remover bloco
              </button>
            )}
          </div>

          <dl className="divide-y divide-[#1A1A1A]/15">
            {content.techSheetRows.map((row) => (
              <div
                key={row.id}
                data-testid={`tech-row-${row.id}`}
                className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-6"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 items-baseline">
                  <EditableText
                    as="dt"
                    editable={isAdmin}
                    value={row.label}
                    resetVersion={resetVersion}
                    onCommit={(val) =>
                      commitChange((prev) => ({
                        ...prev,
                        techSheetRows: prev.techSheetRows.map((r) =>
                          r.id === row.id ? { ...r, label: val } : r
                        ),
                      }))
                    }
                    className="sm:col-span-4 font-vintage text-[15px] text-[#2071B8]"
                    ariaLabel={`Editar função ${row.label}`}
                  />
                  <EditableText
                    as="dd"
                    editable={isAdmin}
                    value={row.value}
                    resetVersion={resetVersion}
                    onCommit={(val) =>
                      commitChange((prev) => ({
                        ...prev,
                        techSheetRows: prev.techSheetRows.map((r) =>
                          r.id === row.id ? { ...r, value: val } : r
                        ),
                      }))
                    }
                    className="sm:col-span-8 font-vintage text-[15px] sm:text-[15.5px] leading-[1.68] text-[#1A1A1A]"
                    ariaLabel={`Editar crédito de ${row.label}`}
                  />
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    data-testid={`remove-tech-row-${row.id}`}
                    onClick={() =>
                      commitChange((prev) => removeTechSheetRow(prev, row.id))
                    }
                    className="self-start sm:self-center shrink-0 px-2 py-0.5 text-[10px] font-mono-ui border border-[#1A1A1A]/25 text-[#5C5952] hover:bg-red-50 hover:text-red-700 cursor-pointer"
                  >
                    ✕ Remover bloco
                  </button>
                )}
              </div>
            ))}
          </dl>
        </article>
      )}

      {/* Dynamically Added Custom Blocks */}
      {content.customSections.length > 0 && (
        <div className="space-y-6">
          {content.customSections.map((section) => (
            <article
              key={section.id}
              data-testid={`custom-about-section-${section.id}`}
              className="border border-[#1A1A1A] bg-white p-6 space-y-3 shadow-[6px_6px_0_#1A1A1A]"
            >
              <div className="flex items-start justify-between gap-4">
                <EditableText
                  as="h2"
                  editable={isAdmin}
                  value={section.title}
                  resetVersion={resetVersion}
                  onCommit={(val) =>
                    commitChange((prev) => ({
                      ...prev,
                      customSections: prev.customSections.map((s) =>
                        s.id === section.id ? { ...s, title: val } : s
                      ),
                    }))
                  }
                  className="font-script text-4xl text-[#1A1A1A] leading-none"
                  ariaLabel="Editar título do bloco adicionado"
                />
                {isAdmin && (
                  <button
                    type="button"
                    data-testid={`remove-custom-section-${section.id}`}
                    onClick={() => handleRemoveSection(section.id)}
                    aria-label={`Remover bloco ${section.title}`}
                    className="shrink-0 px-2 py-0.5 text-[10px] font-mono-ui border border-[#1A1A1A]/25 text-[#5C5952] hover:bg-red-50 hover:text-red-700 cursor-pointer"
                  >
                    ✕ Remover bloco
                  </button>
                )}
              </div>

              <EditableText
                as="p"
                editable={isAdmin}
                value={section.body}
                resetVersion={resetVersion}
                onCommit={(val) =>
                  commitChange((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((s) =>
                      s.id === section.id ? { ...s, body: val } : s
                    ),
                  }))
                }
                className="font-vintage text-[15px] leading-[1.74] text-[#2C2A27]"
                ariaLabel="Editar texto do bloco adicionado"
              />
            </article>
          ))}
        </div>
      )}

      {/* Discreet Contact Footer */}
      <footer className="border-t border-[#1A1A1A]/15 pt-5 text-center">
        <p className="font-mono-ui text-xs text-[#5C5952] tracking-wide">
          contato email:{' '}
          <a
            href="mailto:sofiacaversanfr@gmail.com"
            className="text-[#2071B8] underline underline-offset-4 hover:text-[#A84B70] transition-colors"
          >
            sofiacaversanfr@gmail.com
          </a>
        </p>
      </footer>
    </section>
  );
};
