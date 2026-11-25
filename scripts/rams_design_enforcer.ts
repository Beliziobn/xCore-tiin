import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

export interface RamsPolicyConfig {
  maxWordsCard: number;
  maxWordsModal: number;
  maxWordsDiv: number;
  maxBadgesPerCard: number;
  bannedClassPatterns: RegExp[];
  bannedInlineStyles: RegExp[];
}

export interface Violation {
  filePath: string;
  element: string;
  rule: string;
  detail: string;
  fixed: boolean;
}

const DEFAULT_CONFIG: RamsPolicyConfig = {
  maxWordsCard: 45,
  maxWordsModal: 120,
  maxWordsDiv: 80,
  maxBadgesPerCard: 2,
  bannedClassPatterns: [
    /^bg-(yellow|warning|amber|orange|pink|purple|indigo|cyan|teal|lime|emerald)-?\d*$/i,
    /^border-(yellow|warning|amber|orange|pink|purple|info|primary|success|danger)-?\d*$/i,
    /^alert-(warning|info|success|danger|primary)$/i,
    /^shadow-(lg|xl|2xl)$/i,
  ],
  bannedInlineStyles: [
    /background(-color)?\s*:\s*(yellow|#fff[0-9a-f]{3}|#fef[0-9a-f]{3}|rgb\(255,\s*2[3-5]\d)/gi,
    /box-shadow\s*:[^;]+;?/gi,
  ],
};

const CSS_STANDARD = `/* Política Visual Dieter Rams / Apple HIG - Gerado Automaticamente */
:root {
  --rams-bg: #FFFFFF;
  --rams-border: #E5E5EA;
  --rams-text: #1D1D1F;
  --rams-muted: #6E6E73;
  --rams-accent: #0071E3;
  --rams-radius: 14px;
}
.rams-card, .rams-modal {
  background: var(--rams-bg) !important;
  border: 1px solid var(--rams-border) !important;
  border-radius: var(--rams-radius) !important;
  box-shadow: none !important;
  color: var(--rams-text) !important;
  padding: 24px !important;
}
.rams-badge-clean {
  background: transparent !important;
  border: none !important;
  color: var(--rams-muted) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0 !important;
}
.rams-details summary {
  cursor: pointer;
  color: var(--rams-accent);
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
}
`;

export class RamsDesignEnforcer {
  private config: RamsPolicyConfig;
  public violations: Violation[] = [];

  constructor(config: RamsPolicyConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  private wordCount($: cheerio.CheerioAPI, el: Element): number {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }

  private isComponent($: cheerio.CheerioAPI, el: Element, keywords: string[]): boolean {
    const classes = ($(el).attr('class') || '').toLowerCase();
    const id = ($(el).attr('id') || '').toLowerCase();
    const role = ($(el).attr('role') || '').toLowerCase();
    return keywords.some((k) => classes.includes(k) || id.includes(k) || role.includes(k));
  }

  private cleanVisualNoise($: cheerio.CheerioAPI, el: Element, filePath: string, apply: boolean): boolean {
    let changed = false;
    const rawClasses = $(el).attr('class') || '';
    const classes = rawClasses.split(/\s+/).filter(Boolean);

    if (classes.length > 0) {
      const cleaned = classes.filter(
        (c) => !this.config.bannedClassPatterns.some((rx) => rx.test(c))
      );
      if (cleaned.length !== classes.length) {
        const removed = classes.filter((c) => !cleaned.includes(c));
        this.violations.push({
          filePath,
          element: `<${el.tagName}>`,
          rule: 'COR_EXCESSIVA',
          detail: `Classes removidas: ${removed.sort().join(', ')}`,
          fixed: apply,
        });
        if (apply) {
          $(el).attr('class', cleaned.join(' '));
          changed = true;
        }
      }
    }

    const style = $(el).attr('style') || '';
    if (style && this.config.bannedInlineStyles.some((rx) => new RegExp(rx.source, 'i').test(style))) {
      this.violations.push({
        filePath,
        element: `<${el.tagName}>`,
        rule: 'ESTILO_INLINE_RUIDOSO',
        detail: 'Fundo colorido ou sombra inline detetada',
        fixed: apply,
      });
      if (apply) {
        let newStyle = style;
        for (const rx of this.config.bannedInlineStyles) {
          newStyle = newStyle.replace(rx, '');
        }
        newStyle = newStyle.replace(/;\s*;/g, ';').replace(/^[;\s]+|[;\s]+$/g, '');
        if (newStyle) {
          $(el).attr('style', newStyle);
        } else {
          $(el).removeAttr('style');
        }
        changed = true;
      }
    }

    return changed;
  }

  private enforceBadgeLimit($: cheerio.CheerioAPI, el: Element, filePath: string, apply: boolean): boolean {
    const badges: Element[] = [];
    $(el)
      .find('span, div, a')
      .each((_, child) => {
        if (this.isComponent($, child, ['badge', 'pill', 'tag', 'chip', 'label'])) {
          badges.push(child);
        }
      });

    if (badges.length > this.config.maxBadgesPerCard) {
      this.violations.push({
        filePath,
        element: `<${el.tagName}>`,
        rule: 'EXCESSO_DE_BADGES',
        detail: `${badges.length} etiquetas encontradas (máx: ${this.config.maxBadgesPerCard})`,
        fixed: apply,
      });
      if (apply) {
        badges.forEach((b) => $(b).attr('class', 'rams-badge-clean'));
        return true;
      }
    }
    return false;
  }

  private enforceTextBudget(
    $: cheerio.CheerioAPI,
    el: Element,
    limit: number,
    label: string,
    filePath: string,
    apply: boolean
  ): boolean {
    const words = this.wordCount($, el);
    if (words <= limit) return false;

    this.violations.push({
      filePath,
      element: label,
      rule: 'EXCESSO_DE_ESCRITA',
      detail: `${words} palavras (limite: ${limit})`,
      fixed: apply,
    });

    if (!apply) return false;

    const longPs: Element[] = [];
    $(el)
      .find('p')
      .each((_, p) => {
        if (this.wordCount($, p) > 25) {
          longPs.push(p);
        }
      });

    if (longPs.length === 0) return false;

    const toMove = longPs.length > 1 ? longPs.slice(1) : longPs;
    const detailsHtml = `<details class="rams-details"><summary>Ver detalhes</summary></details>`;
    const $details = $(detailsHtml);
    toMove.forEach((p) => {
      $details.append($(p).clone());
      $(p).remove();
    });
    $(el).append($details);
    return true;
  }

  public processFile(filePath: string, apply = false): boolean {
    const original = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(original);
    let modified = false;

    $('div, section, article').each((_, el) => {
      const isModal = this.isComponent($, el, ['modal', 'dialog']);
      const isCard = this.isComponent($, el, ['card', 'panel', 'box', 'tile']);

      if (this.cleanVisualNoise($, el, filePath, apply)) {
        modified = true;
      }

      if (isModal) {
        if (apply && !$(el).hasClass('rams-modal')) {
          $(el).addClass('rams-modal');
          modified = true;
        }
        if (this.enforceTextBudget($, el, this.config.maxWordsModal, 'MODAL', filePath, apply)) {
          modified = true;
        }
      } else if (isCard) {
        if (apply && !$(el).hasClass('rams-card')) {
          $(el).addClass('rams-card');
          modified = true;
        }
        if (this.enforceBadgeLimit($, el, filePath, apply)) {
          modified = true;
        }
        if (this.enforceTextBudget($, el, this.config.maxWordsCard, 'CARD', filePath, apply)) {
          modified = true;
        }
      } else if (el.tagName === 'div') {
        const attrs = Object.keys(el.attribs || {});
        const hasFunctionalAttr = attrs.some(
          (k) => k === 'id' || k.startsWith('data-') || k.startsWith('hx-')
        );
        if ($(el).contents().length === 0 && !hasFunctionalAttr) {
          this.violations.push({
            filePath,
            element: '<div>',
            rule: 'DIV_VAZIA',
            detail: 'Contentor vazio desnecessário',
            fixed: apply,
          });
          if (apply) {
            $(el).remove();
            modified = true;
          }
        } else if ($(el).find('div, section, article, table').length === 0) {
          if (this.enforceTextBudget($, el, this.config.maxWordsDiv, 'DIV', filePath, apply)) {
            modified = true;
          }
        }
      }
    });

    if (apply && modified) {
      fs.copyFileSync(filePath, `${filePath}.bak`);
      fs.writeFileSync(filePath, $.html(), 'utf-8');
    }

    return modified;
  }

  private walkFiles(dirPath: string, extensions: Set<string>): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dirPath)) return results;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.walkFiles(fullPath, extensions));
      } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
    return results;
  }

  public run(targetDir: string, apply = false): void {
    const extensions = new Set(['.html', '.htm', '.jinja', '.jinja2']);
    const files = this.walkFiles(targetDir, extensions);

    for (const f of files) {
      this.processFile(f, apply);
    }

    if (apply) {
      const cssFile = path.join(targetDir, 'rams-policy.css');
      fs.writeFileSync(cssFile, CSS_STANDARD, 'utf-8');
    }

    const mode = apply ? 'APLICADO (com backup .bak)' : 'AUDITORIA (sem alterações)';
    console.log(`\n=== POLÍTICA DIETER RAMS · ${mode} ===`);
    console.log(`Ficheiros analisados: ${files.length} | Violações detetadas: ${this.violations.length}\n`);
    for (const v of this.violations) {
      const status = v.fixed ? '[CORRIGIDO]' : '[ALERTA]';
      console.log(`${status} ${path.basename(v.filePath)} | ${v.element} | ${v.rule}: ${v.detail}`);
    }
  }
}

// CLI execution
const isMain = process.argv[1] && process.argv[1].includes('rams_design_enforcer');
if (isMain) {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const targetArg = args.find((a) => !a.startsWith('--')) || '.';
  const enforcer = new RamsDesignEnforcer();
  enforcer.run(path.resolve(process.cwd(), targetArg), apply);
}
