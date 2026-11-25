/**
 * Strict SVG sanitizer and recursive registrationData flattener.
 * Prevents HTML/script injection when rendering school logos and
 * eliminates recursive registrationData nesting bloat across sync cycles.
 */

const ALLOWED_SVG_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'lineargradient',
  'radialgradient',
  'stop',
  'clippath',
  'title',
  'desc',
  'symbol',
  'use',
]);

const ALLOWED_SVG_ATTRS = new Set([
  'viewbox',
  'width',
  'height',
  'xmlns',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-opacity',
  'opacity',
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'dx',
  'dy',
  'points',
  'transform',
  'id',
  'class',
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientunits',
  'gradienttransform',
  'clip-path',
  'clip-rule',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
  'letter-spacing',
  'preserveaspectratio',
]);

function isSafeAttrValue(attrName: string, value: string): boolean {
  const lower = value.trim().toLowerCase();
  if (
    lower.includes('javascript:') ||
    lower.includes('vbscript:') ||
    lower.includes('data:text/html') ||
    lower.includes('expression(')
  ) {
    return false;
  }
  if ((attrName === 'href' || attrName === 'xlink:href') && !lower.startsWith('#')) {
    return false;
  }
  return true;
}

/**
 * Sanitizes an untrusted SVG markup string, stripping scripts, event handlers,
 * foreignObject, external URLs, and disallowed elements.
 */
export function sanitizeSvgMarkup(rawSvg?: string | null): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  const trimmed = rawSvg.trim();
  if (!trimmed || !trimmed.toLowerCase().includes('<svg')) return '';

  // Server-side / non-DOM fallback: regex strip dangerous constructs
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return trimmed
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'image/svg+xml');
    const parseError = doc.querySelector('parsererror');
    const root = doc.documentElement;
    if (parseError || !root || root.tagName.toLowerCase() !== 'svg') {
      return '';
    }

    const cleanNode = (node: Element) => {
      const children = Array.from(node.children);
      for (const child of children) {
        const tag = child.tagName.toLowerCase();
        if (!ALLOWED_SVG_TAGS.has(tag)) {
          child.remove();
          continue;
        }
        for (const attr of Array.from(child.attributes)) {
          const name = attr.name.toLowerCase();
          if (name.startsWith('on') || !ALLOWED_SVG_ATTRS.has(name) || !isSafeAttrValue(name, attr.value)) {
            child.removeAttribute(attr.name);
          }
        }
        cleanNode(child);
      }
    };

    for (const attr of Array.from(root.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || !ALLOWED_SVG_ATTRS.has(name) || !isSafeAttrValue(name, attr.value)) {
        root.removeAttribute(attr.name);
      }
    }
    cleanNode(root);

    return new XMLSerializer().serializeToString(root);
  } catch {
    return '';
  }
}

/**
 * Strips any recursively nested `registrationData` inside `registrationData`
 * so entities (teachers, students, directors, schools) never bloat across sync cycles.
 */
export function stripNestedRegistrationData<T>(entity: T): T {
  if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
    return entity;
  }
  const obj = entity as Record<string, any>;
  if (!obj.registrationData || typeof obj.registrationData !== 'object') {
    return entity;
  }
  const { registrationData: _ignored, ...cleanReg } = obj.registrationData;
  return {
    ...obj,
    registrationData: cleanReg,
  } as T;
}

/**
 * Extracts a clean flat copy of an entity's registrationData without any recursive `registrationData` key.
 */
export function extractFlatRegistrationData(item: any): Record<string, any> | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const source = item.nomeCompleto || item.escola || item.nomeOficial ? item : item.registrationData;
  if (!source || typeof source !== 'object') return undefined;
  const baseFromNested =
    item.registrationData && typeof item.registrationData === 'object'
      ? (() => {
          const { registrationData: _d1, ...rest } = item.registrationData;
          return rest;
        })()
      : {};
  const { registrationData: _d2, ...restSource } = source;
  return { ...baseFromNested, ...restSource };
}
