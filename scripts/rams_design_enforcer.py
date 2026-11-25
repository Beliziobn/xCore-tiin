import argparse
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import List, Set, Tuple
from bs4 import BeautifulSoup, Tag


@dataclass(frozen=True)
class RamsPolicyConfig:
    max_words_card: int = 45
    max_words_modal: int = 120
    max_words_div: int = 80
    max_badges_per_card: int = 2
    # Padrões de classes coloridas/ruidosas (Bootstrap, Tailwind, custom)
    banned_class_patterns: Tuple[str, ...] = (
        r"^bg-(yellow|warning|amber|orange|pink|purple|indigo|cyan|teal|lime|emerald)-?\d*$",
        r"^border-(yellow|warning|amber|orange|pink|purple|info|primary|success|danger)-?\d*$",
        r"^alert-(warning|info|success|danger|primary)$",
        r"^shadow-(lg|xl|2xl)$",
    )
    banned_inline_styles: Tuple[str, ...] = (
        r"background(-color)?\s*:\s*(yellow|#fff[0-9a-f]{3}|#fef[0-9a-f]{3}|rgb\(255,\s*2[3-5]\d)",
        r"box-shadow\s*:",
    )


@dataclass
class Violation:
    file_path: Path
    element: str
    rule: str
    detail: str
    fixed: bool = False


class RamsDesignEnforcer:
    """Audita e refatora HTML/Templates segundo a filosofia 'Menos, mas melhor'."""

    CSS_STANDARD = """/* Política Visual Dieter Rams / Apple HIG - Gerado Automaticamente */
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
"""

    def __init__(self, config: RamsPolicyConfig = RamsPolicyConfig()):
        self.config = config
        self.compiled_class_regex = [re.compile(p, re.I) for p in config.banned_class_patterns]
        self.compiled_style_regex = [re.compile(p, re.I) for p in config.banned_inline_styles]
        self.violations: List[Violation] = []

    def _word_count(self, tag: Tag) -> int:
        text = " ".join(tag.get_text(" ", strip=True).split())
        return len(text.split()) if text else 0

    def _is_component(self, tag: Tag, keywords: Set[str]) -> bool:
        classes = " ".join(tag.get("class", [])).lower()
        tag_id = (tag.get("id") or "").lower()
        role = (tag.get("role") or "").lower()
        return any(k in classes or k in tag_id or k in role for k in keywords)

    def _clean_visual_noise(self, tag: Tag, file_path: Path, apply: bool) -> bool:
        changed = False
        classes = tag.get("class", [])
        if classes:
            cleaned = [c for c in classes if not any(rx.match(c) for rx in self.compiled_class_regex)]
            if len(cleaned) != len(classes):
                removed = set(classes) - set(cleaned)
                self.violations.append(Violation(
                    file_path, f"<{tag.name}>", "COR_EXCESSIVA",
                    f"Classes removidas: {', '.join(sorted(removed))}", fixed=apply
                ))
                if apply:
                    tag["class"] = cleaned
                    changed = True

        style = tag.get("style", "")
        if style and any(rx.search(style) for rx in self.compiled_style_regex):
            self.violations.append(Violation(
                file_path, f"<{tag.name}>", "ESTILO_INLINE_RUIDOSO",
                "Fundo colorido ou sombra inline detetada", fixed=apply
            ))
            if apply:
                new_style = style
                for rx in self.compiled_style_regex:
                    new_style = rx.sub("", new_style)
                new_style = re.sub(r";\s*;", ";", new_style).strip(" ;")
                if new_style:
                    tag["style"] = new_style
                else:
                    del tag["style"]
                changed = True

        return changed

    def _enforce_badge_limit(self, container: Tag, file_path: Path, apply: bool) -> bool:
        badges = [
            el for el in container.find_all(["span", "div", "a"])
            if self._is_component(el, {"badge", "pill", "tag", "chip", "label"})
        ]
        if len(badges) > self.config.max_badges_per_card:
            self.violations.append(Violation(
                file_path, f"<{container.name}>", "EXCESSO_DE_BADGES",
                f"{len(badges)} etiquetas encontradas (máx: {self.config.max_badges_per_card})", fixed=apply
            ))
            if apply:
                for b in badges:
                    b["class"] = ["rams-badge-clean"]
                return True
        return False

    def _enforce_text_budget(self, tag: Tag, limit: int, label: str, soup: BeautifulSoup, file_path: Path, apply: bool) -> bool:
        words = self._word_count(tag)
        if words <= limit:
            return False

        self.violations.append(Violation(
            file_path, label, "EXCESSO_DE_ESCRITA",
            f"{words} palavras (limite: {limit})", fixed=apply
        ))

        if not apply:
            return False

        # Compacta parágrafos longos dentro do componente num bloco expansível
        paragraphs = tag.find_all("p", recursive=True)
        long_ps = [p for p in paragraphs if self._word_count(p) > 25]
        if not long_ps:
            return False

        details = soup.new_tag("details", attrs={"class": "rams-details"})
        summary = soup.new_tag("summary")
        summary.string = "Ver detalhes"
        details.append(summary)

        for p in long_ps[1:] if len(long_ps) > 1 else long_ps:
            details.append(p.extract())

        tag.append(details)
        return True

    def process_file(self, file_path: Path, apply: bool = False) -> bool:
        original = file_path.read_text(encoding="utf-8", errors="ignore")
        soup = BeautifulSoup(original, "html.parser")
        modified = False

        # 1. Auditar e padronizar Modals, Cards e Divs
        for tag in soup.find_all(["div", "section", "article"]):
            is_modal = self._is_component(tag, {"modal", "dialog"})
            is_card = self._is_component(tag, {"card", "panel", "box", "tile"})

            if self._clean_visual_noise(tag, file_path, apply):
                modified = True

            if is_modal:
                if apply and "rams-modal" not in tag.get("class", []):
                    tag["class"] = tag.get("class", []) + ["rams-modal"]
                    modified = True
                if self._enforce_text_budget(tag, self.config.max_words_modal, "MODAL", soup, file_path, apply):
                    modified = True

            elif is_card:
                if apply and "rams-card" not in tag.get("class", []):
                    tag["class"] = tag.get("class", []) + ["rams-card"]
                    modified = True
                if self._enforce_badge_limit(tag, file_path, apply):
                    modified = True
                if self._enforce_text_budget(tag, self.config.max_words_card, "CARD", soup, file_path, apply):
                    modified = True

            elif tag.name == "div":
                # Remove divs vazios sem atributos funcionais (id, data-*, hx-*)
                if not tag.contents and not any(k.startswith(("id", "data-", "hx-")) for k in tag.attrs):
                    self.violations.append(Violation(
                        file_path, "<div>", "DIV_VAZIA", "Contentor vazio desnecessário", fixed=apply
                    ))
                    if apply:
                        tag.decompose()
                        modified = True
                elif not tag.find(["div", "section", "article", "table"]):
                    if self._enforce_text_budget(tag, self.config.max_words_div, "DIV", soup, file_path, apply):
                        modified = True

        if apply and modified:
            backup_path = file_path.with_suffix(file_path.suffix + ".bak")
            shutil.copy2(file_path, backup_path)
            file_path.write_text(str(soup), encoding="utf-8")

        return modified

    def run(self, target_dir: Path, apply: bool = False) -> None:
        extensions = {".html", ".htm", ".jinja", ".jinja2"}
        files = [p for p in target_dir.rglob("*") if p.suffix.lower() in extensions]

        for f in files:
            self.process_file(f, apply=apply)

        if apply:
            css_file = target_dir / "rams-policy.css"
            css_file.write_text(self.CSS_STANDARD, encoding="utf-8")

        self._print_report(len(files), apply)

    def _print_report(self, total_files: int, applied: bool) -> None:
        mode = "APLICADO (com backup .bak)" if applied else "AUDITORIA (sem alterações)"
        print(f"\n=== POLÍTICA DIETER RAMS · {mode} ===")
        print(f"Ficheiros analisados: {total_files} | Violações detetadas: {len(self.violations)}\n")
        for v in self.violations:
            status = "[CORRIGIDO]" if v.fixed else "[ALERTA]"
            print(f"{status} {v.file_path.name} | {v.element} | {v.rule}: {v.detail}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Política de Design Minimalista (Apple / Dieter Rams)")
    parser.add_argument("pasta", type=Path, help="Diretório dos templates HTML do sistema")
    parser.add_argument("--apply", action="store_true", help="Aplica as correções e gera rams-policy.css")
    args = parser.parse_args()

    enforcer = RamsDesignEnforcer()
    enforcer.run(args.pasta, apply=args.apply)


if __name__ == "__main__":
    main()
