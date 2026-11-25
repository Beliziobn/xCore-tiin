import html
import webbrowser
from dataclasses import dataclass
from pathlib import Path
from typing import List


@dataclass(frozen=True)
class ResumoEscola:
    nome: str
    nivel: str        # Polivalente, Ensino Primário
    natureza: str     # Pública, Público-Privada
    feminino: int
    masculino: int
    quota: int

    @property
    def total_alunos(self) -> int:
        return self.feminino + self.masculino

    @property
    def pendentes(self) -> int:
        return max(0, self.quota - self.total_alunos)


class SigreAlunosMinimal:
    CSS = """
    :root {
        --bg: #FFFFFF;
        --hover: #F5F5F7;
        --border: #E5E5EA;
        --text: #1D1D1F;
        --muted: #6E6E73;
        --subtle: #86868B;
        --accent: #0071E3;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
        -webkit-font-smoothing: antialiased;
        padding: 40px 32px;
    }

    .container {
        max-width: 1180px;
        margin: 0 auto;
    }

    /* Aviso institucional discreto (substitui o banner azul-escuro) */
    .notice-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        border: 1px solid var(--border);
        border-radius: 10px;
        font-size: 13px;
        color: var(--muted);
        margin-bottom: 32px;
        flex-wrap: wrap;
    }

    .notice-bar strong { color: var(--text); font-weight: 500; }

    .btn-outline {
        text-decoration: none;
        color: var(--text);
        border: 1px solid var(--border);
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.15s ease;
        white-space: nowrap;
    }

    .btn-outline:hover { background: var(--hover); }

    /* Cabeçalho e KPIs limpos sem caixas coloridas */
    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 24px;
        margin-bottom: 28px;
        flex-wrap: wrap;
    }

    h1 {
        font-size: 26px;
        font-weight: 600;
        letter-spacing: -0.02em;
    }

    .subtitle {
        font-size: 13px;
        color: var(--muted);
        margin-top: 4px;
    }

    .kpi-strip {
        display: flex;
        gap: 32px;
        padding: 16px 0;
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        margin-bottom: 24px;
        flex-wrap: wrap;
    }

    .kpi-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--subtle);
        margin-bottom: 4px;
    }

    .kpi-value {
        font-size: 22px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.02em;
    }

    .kpi-value.muted { color: var(--muted); }

    .search-input {
        width: 280px;
        padding: 9px 14px;
        border: 1px solid var(--border);
        border-radius: 9px;
        font-size: 14px;
        outline: none;
    }

    .search-input:focus { border-color: var(--text); }

    /* Tabela minimalista (substitui os cartões redundantes) */
    .table-wrap { overflow-x: auto; }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }

    th {
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--subtle);
        padding: 12px 14px;
        border-bottom: 1px solid var(--border);
    }

    th.num, td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    td {
        padding: 16px 14px;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
    }

    tbody tr:hover { background: var(--hover); }

    .school-title {
        font-weight: 500;
        color: var(--text);
    }

    .school-meta {
        font-size: 12px;
        color: var(--subtle);
        margin-top: 2px;
    }

    .gender-split {
        font-size: 12px;
        color: var(--muted);
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        font-size: 13px;
    }

    .link-action {
        color: var(--accent);
        text-decoration: none;
        font-weight: 500;
    }

    .link-action:hover { text-decoration: underline; }

    .link-secondary {
        color: var(--muted);
        text-decoration: none;
    }

    .link-secondary:hover { color: var(--text); }
    """

    def render(self, escolas: List[ResumoEscola], quota_total_municipio: int) -> str:
        total_alunos = sum(e.total_alunos for e in escolas)
        total_f = sum(e.feminino for e in escolas)
        total_m = sum(e.masculino for e in escolas)
        total_pendentes = max(0, quota_total_municipio - total_alunos)

        rows = []
        for e in escolas:
            search_key = html.escape(f"{e.nome} {e.nivel} {e.natureza}".lower())
            rows.append(f"""
            <tr data-search="{search_key}">
                <td>
                    <div class="school-title">{html.escape(e.nome)}</div>
                    <div class="school-meta">{html.escape(e.nivel)} · {html.escape(e.natureza)}</div>
                </td>
                <td class="num">
                    <strong>{e.total_alunos}</strong>
                    <div class="gender-split">F: {e.feminino} · M: {e.masculino}</div>
                </td>
                <td class="num">{e.quota:,}</td>
                <td class="num"><strong>{e.pendentes:,}</strong></td>
                <td>
                    <div class="actions">
                        <a href="#filtrar" class="link-secondary">Filtrar alunos</a>
                        <a href="#painel" class="link-action">Painel →</a>
                    </div>
                </td>
            </tr>
            """)

        return f"""<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registo Geral de Alunos · SIGRE Angola</title>
    <style>{self.CSS}</style>
</head>
<body>
    <div class="container">
        <div class="notice-bar">
            <span><strong>Direcção Municipal da Educação (DME):</strong> Modo de consulta. O cadastro de alunos é feito exclusivamente pelo Director de Escola.</span>
            <a href="#painel-director" class="btn-outline">Painel do Director</a>
        </div>

        <div class="header-row">
            <div>
                <h1>Quantidades de Alunos por Escola</h1>
                <p class="subtitle">Instrumento Complementar 2026/2027</p>
            </div>
            <input id="q" class="search-input" type="search" placeholder="Pesquisar escola...">
        </div>

        <section class="kpi-strip">
            <div>
                <div class="kpi-label">Total Alunos</div>
                <div class="kpi-value">{total_alunos:,}</div>
            </div>
            <div>
                <div class="kpi-label">Feminino</div>
                <div class="kpi-value muted">{total_f:,}</div>
            </div>
            <div>
                <div class="kpi-label">Masculino</div>
                <div class="kpi-value muted">{total_m:,}</div>
            </div>
            <div>
                <div class="kpi-label">Quota Declarada</div>
                <div class="kpi-value">{quota_total_municipio:,}</div>
            </div>
            <div>
                <div class="kpi-label">Pendentes</div>
                <div class="kpi-value">{total_pendentes:,}</div>
            </div>
        </section>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Unidade Escolar</th>
                        <th class="num">Alunos (F / M)</th>
                        <th class="num">Quota</th>
                        <th class="num">Pendentes</th>
                        <th class="num">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(rows)}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        const input = document.getElementById('q');
        const rows = document.querySelectorAll('tbody tr');
        input.addEventListener('input', (e) => {{
            const term = e.target.value.trim().toLowerCase();
            rows.forEach(tr => {{
                tr.style.display = tr.dataset.search.includes(term) ? '' : 'none';
            }});
        }});
    </script>
</body>
</html>
"""


def main() -> None:
    escolas = [
        ResumoEscola("Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua", "Polivalente", "Pública", 0, 0, 480),
        ResumoEscola("Complexo Escolar Católico n.º 269 MJE – Lar Nazaré – Quêssua", "Polivalente", "Público-Privada", 0, 0, 1250),
        ResumoEscola("Complexo Escolar Católico n.º 274 MJE – Nossa Senhora de Guadalupe – Quêssua", "Polivalente", "Público-Privada", 0, 0, 1256),
        ResumoEscola("Complexo Escolar Metodista Sião n.º 289 MJE – Monte Sinai – Quêssua", "Polivalente", "Pública", 0, 0, 480),
        ResumoEscola("Complexo Escolar n.º 285 MJE – Cambondo – Quêssua", "Polivalente", "Pública", 0, 0, 1144),
        ResumoEscola("Complexo Escolar n.º 291 MJE – Quissol – Quêssua", "Polivalente", "Pública", 0, 0, 480),
        ResumoEscola("Escola Primária Metodista n.º 209 MJE – São Paulo – Quêssua", "Ensino Primário", "Pública", 0, 0, 320),
        ResumoEscola("Escola Primária Católica n.º 202 MJE – Edith Almeida De Sousa – Quêssua", "Ensino Primário", "Pública", 0, 0, 320),
        ResumoEscola("Escola Primária Católica n.º 208 MJE – Santa Teresinha – Quêssua", "Ensino Primário", "Público-Privada", 0, 0, 701),
        ResumoEscola("Escola Primária IEPA n.º 163 MJE – Rev. Ferreira Francisco – Quêssua", "Ensino Primário", "Pública", 0, 0, 320),
    ]

    output = Path("sigre_alunos_minimal.html").resolve()
    output.write_text(SigreAlunosMinimal().render(escolas, quota_total_municipio=47561), encoding="utf-8")
    print(f"Interface gerada em: {output}")
    webbrowser.open(output.as_uri())


if __name__ == "__main__":
    main()
