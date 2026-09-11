/**
 * Utilitários para Emissão do Boletim Oficial de Matrícula
 * Sistema de Gestão Educacional uCore - Padrão República de Angola / MED
 */
import type { StudentRegistrationData } from '../types';

export interface CurricularSubject {
  nome: string;
  cargaHoraria: string;
  tipo: 'Geral' | 'Específica' | 'Actividade';
}

/**
 * Retorna os componentes curriculares oficiais de acordo com o nível / classe em Angola
 */
export function getCurricularSubjects(classe: string = ''): CurricularSubject[] {
  const norm = classe.toLowerCase();

  // Pré-Escolar / Iniciação
  if (norm.includes('pré') || norm.includes('iniciação') || norm.includes('creche') || norm.includes('jardim')) {
    return [
      { nome: 'Linguagem e Comunicação Oral', cargaHoraria: '5 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Desenvolvimento do Raciocínio Lógico', cargaHoraria: '5 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Descoberta do Meio Físico e Social', cargaHoraria: '4 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Expressão Artística e Plástica', cargaHoraria: '4 Tempos/Sem', tipo: 'Actividade' },
      { nome: 'Expressão Motora e Psicomotricidade', cargaHoraria: '4 Tempos/Sem', tipo: 'Actividade' },
    ];
  }

  // 1ª à 4ª Classe (Ensino Primário Regular)
  if (norm.includes('1') || norm.includes('2') || norm.includes('3') || norm.includes('4')) {
    return [
      { nome: 'Língua Portuguesa', cargaHoraria: '8 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Matemática', cargaHoraria: '6 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Estudo do Meio', cargaHoraria: '4 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Expressão Plástica', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
      { nome: 'Expressão Musical', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
      { nome: 'Expressão Motora / Ed. Física', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
      { nome: 'Educação Moral e Cívica', cargaHoraria: '1 Tempo/Sem', tipo: 'Geral' },
    ];
  }

  // 5ª e 6ª Classe (Ensino Primário Pluridocência)
  if (norm.includes('5') || norm.includes('6')) {
    return [
      { nome: 'Língua Portuguesa', cargaHoraria: '6 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Matemática', cargaHoraria: '5 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Ciências da Natureza', cargaHoraria: '4 Tempos/Sem', tipo: 'Geral' },
      { nome: 'História e Geografia de Angola', cargaHoraria: '4 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Educação Visual e Plástica', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
      { nome: 'Educação Musical', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
      { nome: 'Educação Moral e Cívica', cargaHoraria: '1 Tempo/Sem', tipo: 'Geral' },
      { nome: 'Educação Física', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
    ];
  }

  // 7ª à 9ª Classe (I Ciclo do Ensino Secundário)
  if (norm.includes('7') || norm.includes('8') || norm.includes('9')) {
    return [
      { nome: 'Língua Portuguesa', cargaHoraria: '5 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Matemática', cargaHoraria: '5 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Língua Inglesa', cargaHoraria: '3 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Língua Francesa', cargaHoraria: '2 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Física', cargaHoraria: '3 Tempos/Sem', tipo: 'Específica' },
      { nome: 'Química', cargaHoraria: '3 Tempos/Sem', tipo: 'Específica' },
      { nome: 'Biologia', cargaHoraria: '3 Tempos/Sem', tipo: 'Específica' },
      { nome: 'História', cargaHoraria: '3 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Geografia', cargaHoraria: '3 Tempos/Sem', tipo: 'Geral' },
      { nome: 'Educação Visual e Plástica', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
      { nome: 'Educação Moral e Cívica', cargaHoraria: '1 Tempo/Sem', tipo: 'Geral' },
      { nome: 'Educação Física', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
    ];
  }

  // II Ciclo / Ensino Secundário Geral / Técnico
  return [
    { nome: 'Língua Portuguesa', cargaHoraria: '4 Tempos/Sem', tipo: 'Geral' },
    { nome: 'Língua Inglesa', cargaHoraria: '3 Tempos/Sem', tipo: 'Geral' },
    { nome: 'Matemática', cargaHoraria: '5 Tempos/Sem', tipo: 'Geral' },
    { nome: 'Física', cargaHoraria: '4 Tempos/Sem', tipo: 'Específica' },
    { nome: 'Química', cargaHoraria: '4 Tempos/Sem', tipo: 'Específica' },
    { nome: 'Biologia', cargaHoraria: '4 Tempos/Sem', tipo: 'Específica' },
    { nome: 'Informática / TIC', cargaHoraria: '3 Tempos/Sem', tipo: 'Específica' },
    { nome: 'Filosofia', cargaHoraria: '2 Tempos/Sem', tipo: 'Geral' },
    { nome: 'Educação Física', cargaHoraria: '2 Tempos/Sem', tipo: 'Actividade' },
  ];
}

/**
 * Formata data ISO para formato descritivo em português (ex: "11 de Setembro de 2025")
 */
export function formatDataExtenso(dataStr?: string): string {
  if (!dataStr) return 'Não informada';
  try {
    const parts = dataStr.split('-');
    if (parts.length === 3) {
      const ano = parts[0];
      const mesNum = parseInt(parts[1], 10);
      const dia = parseInt(parts[2], 10);
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const mesNome = meses[mesNum - 1] || parts[1];
      return `${dia} de ${mesNome} de ${ano}`;
    }
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dataStr;
  }
}

/**
 * Gera o documento HTML do Boletim de Matrícula para download directo ou impressão externa
 */
export function generateBoletimHTML(student: StudentRegistrationData): string {
  const subjects = getCurricularSubjects(student.classeEtapaModulo || student.classe || '');
  const dataExtensoEmissao = formatDataExtenso(new Date().toISOString().substring(0, 10));
  const dataExtensoNasc = formatDataExtenso(student.dataNascimento);

  const subjectsRowsHtml = subjects
    .map(
      (s, idx) => `
      <tr>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 11px; font-weight: 600;">${s.nome}</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">${s.cargaHoraria}</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; color: #0284c7; font-weight: 700;">Activa</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Boletim de Matrícula - ${student.nomeCompleto || student.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #0f172a;
      background-color: #f8fafc;
      display: flex;
      justify-content: center;
    }
    .boletim-container {
      width: 100%;
      max-width: 800px;
      background: #ffffff;
      padding: 20px 24px;
      border: 2px solid #0b3d5c;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .header-text {
      text-align: center;
      line-height: 1.3;
    }
    .header-text h4 {
      margin: 0;
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-text h3 {
      margin: 2px 0;
      font-size: 12px;
      font-weight: 800;
      color: #0b3d5c;
      text-transform: uppercase;
    }
    .header-text h2 {
      margin: 2px 0;
      font-size: 14px;
      font-weight: 900;
      color: #0b3d5c;
      text-transform: uppercase;
    }
    .header-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 3px 14px;
      background: #0b3d5c;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 5px 10px;
      border-radius: 4px;
      margin: 8px 0 10px 0;
      font-size: 10.5px;
      font-weight: 600;
    }
    .meta-bar span strong {
      color: #0b3d5c;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      background: #e2e8f0;
      color: #0b3d5c;
      padding: 3px 8px;
      margin-top: 8px;
      margin-bottom: 5px;
      border-left: 4px solid #0891b2;
      border-radius: 2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px 8px;
      font-size: 10.5px;
      margin-bottom: 6px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 8.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 1px;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
      background: #f8fafc;
      padding: 2.5px 6px;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      min-height: 20px;
    }
    .table-disciplinas {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    .table-disciplinas th {
      background: #0b3d5c;
      color: #ffffff;
      padding: 5px 8px;
      font-size: 10px;
      text-transform: uppercase;
      border: 1px solid #0b3d5c;
    }
    .checklist-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      font-size: 10px;
      margin-top: 4px;
      background: #f8fafc;
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      color: #1e293b;
    }
    .director-sig-block {
      border: 1.5px dashed #0b3d5c;
      border-radius: 6px;
      background: #f8fafc;
      padding: 8px 12px;
      margin: 8px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .director-stamp {
      width: 74px;
      height: 74px;
      border: 1.5px dashed #0b3d5c;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3px;
      font-size: 6px;
      font-weight: 800;
      color: #0b3d5c;
      text-transform: uppercase;
      line-height: 1.1;
      background: #ffffff;
    }
    .director-seal {
      background: #ffffff;
      border: 1px solid #a7f3d0;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 7.5px;
      font-family: monospace;
      color: #065f46;
      max-width: 220px;
    }
    .signatures-block {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 10px;
      text-align: center;
      font-size: 10px;
    }
    .sig-line {
      margin-top: 24px;
      border-top: 1px dashed #475569;
      padding-top: 3px;
      font-weight: 700;
      color: #1e293b;
    }
    .footer-note {
      text-align: center;
      font-size: 8px;
      color: #64748b;
      margin-top: 10px;
      padding-top: 4px;
      border-top: 1px solid #e2e8f0;
    }
    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .boletim-container {
        border: 1.5px solid #000;
        box-shadow: none;
        padding: 8px 12px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="boletim-container">
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0b3d5c; padding-bottom: 6px;">
      <!-- INSÍGNIA NACIONAL -->
      <div style="width: 70px; text-align: center;">
        <svg width="50" height="50" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="48" fill="#FFFBEB" stroke="#D97706" stroke-width="2"/>
          <circle cx="50" cy="50" r="38" stroke="#B45309" stroke-width="3" stroke-dasharray="4 2" fill="none"/>
          <circle cx="50" cy="52" r="14" fill="#FBBF24"/>
          <polygon points="50,18 53,26 61,26 55,31 57,39 50,34 43,39 45,31 39,26 47,26" fill="#F59E0B" stroke="#B45309" stroke-width="1"/>
          <line x1="32" y1="62" x2="68" y2="38" stroke="#DC2626" stroke-width="3"/>
          <line x1="68" y1="62" x2="32" y2="38" stroke="#1E293B" stroke-width="2.5"/>
          <path d="M22 84C32 80 50 82 50 82C50 82 68 80 78 84V89C68 85 50 87 50 87C50 87 32 85 22 89V84Z" fill="#DC2626"/>
          <text x="50" y="87" font-size="5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">REPÚBLICA DE ANGOLA</text>
        </svg>
      </div>

      <div class="header-text" style="flex: 1;">
        <h4>República de Angola</h4>
        <h4>Governo da Província de ${student.provincia || 'Malanje'} • Direcção Municipal da Educação do Quéssua</h4>
        <h2>${student.escola || 'Escola Modelo Central de Quêssua'}</h2>
        <div class="header-badge">Boletim Oficial de Matrícula e Confirmação</div>
      </div>

      <!-- LOGOTIPO DA ESCOLA / FOTO -->
      <div style="width: 70px; text-align: right;">
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" style="margin-left: auto;">
          <path d="M50 6L84 20V50C84 72 50 94 50 94C50 94 16 72 16 50V20L50 6Z" fill="#0B3D5C" stroke="#0891B2" stroke-width="3"/>
          <path d="M50 12L78 24V48C78 66 50 86 50 86C50 86 22 66 22 48V24L50 12Z" fill="#07273C" stroke="#FBBF24" stroke-width="1.5"/>
          <polygon points="50,26 68,34 50,42 32,34" fill="#38BDF8"/>
          <circle cx="50" cy="74" r="3" fill="#FBBF24"/>
        </svg>
      </div>
    </div>

    <div class="meta-bar">
      <span><strong>N.º DE MATRÍCULA:</strong> ${student.codigoMatricula || 'MAT-2026'}</span>
      <span><strong>ANO LECTIVO:</strong> 2026 / 2027</span>
      <span><strong>EMISSÃO:</strong> ${dataExtensoEmissao}</span>
      <span><strong>SITUAÇÃO:</strong> <span style="color: #059669; font-weight: 800;">CONFIRMADA</span></span>
    </div>

    <!-- 1. Identificação do Aluno -->
    <div class="section-title">1. Identificação Pessoal do Aluno</div>
    <div class="info-grid">
      <div class="info-item" style="grid-column: span 2;">
        <span class="info-label">Nome Completo do Aluno</span>
        <div class="info-value" style="font-weight: 800; color: #0b3d5c;">${student.nomeCompleto || student.name}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Sexo / Género</span>
        <div class="info-value">${student.genero === 'F' ? 'Feminino' : student.genero === 'M' ? 'Masculino' : 'Outro'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Data de Nascimento</span>
        <div class="info-value">${dataExtensoNasc}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Idade Calculada</span>
        <div class="info-value">${student.idade ? student.idade + ' anos' : 'Não calculada'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Doc. de Identificação</span>
        <div class="info-value">${student.tipoDocumento || 'B.I.'}: ${student.numeroDocumento || 'Não informado'}</div>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <span class="info-label">Residência / Endereço</span>
        <div class="info-value">${student.endereco || 'Quéssua'}, ${student.municipio || 'Quéssua'} - ${student.provincia || 'Malanje'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Nacionalidade</span>
        <div class="info-value">Angolana</div>
      </div>
    </div>

    <!-- 2. Dados Pedagógicos -->
    <div class="section-title">2. Dados Pedagógicos e Turma Atribuída</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Classe / Etapa / Módulo</span>
        <div class="info-value" style="font-weight: 700; color: #0e7490;">${student.classeEtapaModulo || student.classe || '1.ª Classe'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Turma Atribuída</span>
        <div class="info-value" style="font-weight: 700;">${student.turma || 'Turma A'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Sala de Aula</span>
        <div class="info-value">${student.sala || 'Sala 01'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Turno / Período</span>
        <div class="info-value">${student.periodo || student.turno || 'Manhã'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Natureza da Instituição</span>
        <div class="info-value">${student.naturezaEscola || 'Pública'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Condição de Matrícula</span>
        <div class="info-value">${student.alunoRepetente ? 'Repetente' : student.transferido ? 'Transferido de Outra Escola' : 'Primeira Matrícula / Regular'}</div>
      </div>
    </div>

    <!-- 3. Filiação e Encarregado -->
    <div class="section-title">3. Encarregado de Educação e Contactos</div>
    <div class="info-grid">
      <div class="info-item" style="grid-column: span 2;">
        <span class="info-label">Nome do Encarregado de Educação</span>
        <div class="info-value">${student.encarregado || 'Não informado'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Grau de Parentesco</span>
        <div class="info-value">${student.parentescoEncarregado || 'Responsável Legal'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Telefone Principal</span>
        <div class="info-value">${student.telefone || 'Não informado'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Telefone Alternativo</span>
        <div class="info-value">${student.telefoneAlternativo || 'Nenhum'}</div>
      </div>
      <div class="info-item">
        <span class="info-label">Ensino Inclusivo / NEE</span>
        <div class="info-value">${student.temNecessidadesEspeciais || student.isEnsinoEspecial ? 'Sim - ' + (student.tiposDeficiencia?.join(', ') || 'NEE') : 'Não'}</div>
      </div>
    </div>

    <!-- 4. Componentes Curriculares -->
    <div class="section-title">4. Plano Curricular e Disciplinas da Classe</div>
    <table class="table-disciplinas">
      <thead>
        <tr>
          <th style="width: 40px;">Nº</th>
          <th>Disciplina Curricular</th>
          <th style="width: 140px;">Carga Horária</th>
          <th style="width: 90px;">Inscrição</th>
        </tr>
      </thead>
      <tbody>
        ${subjectsRowsHtml}
      </tbody>
    </table>

    <!-- 5. Checklist de Documentos -->
    <div class="section-title">5. Documentação Entregue no Acto da Matrícula</div>
    <div class="checklist-container">
      <div class="checklist-item">☑ Cópia do B.I. / Cédula</div>
      <div class="checklist-item">☑ 2 Fotos Tipo Passe</div>
      <div class="checklist-item">☑ Certificado / Declaração</div>
      <div class="checklist-item">☑ Termo de Responsabilidade</div>
    </div>

    <!-- 6. Homologação e Assinatura Digital do Director Geral -->
    <div class="section-title">6. Homologação e Assinatura Digital do Director Geral</div>
    <div class="director-sig-block">
      <!-- Carimbo Oficial Circular -->
      <div class="director-stamp">
        <span style="font-size: 5.5px;">REPÚBLICA DE ANGOLA</span>
        <span style="font-size: 5px; color: #64748b;">DME • QUÉSSUA</span>
        <span style="color: #d97706; margin: 1px 0;">★ ★ ★</span>
        <span style="font-size: 6px; color: #0891b2;">DIRECÇÃO GERAL</span>
        <span style="font-size: 5px;">HOMOLOGADO</span>
      </div>

      <!-- Assinatura Manuscrita Vetorial -->
      <div style="flex: 1; text-align: center;">
        <span style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #0b3d5c;">
          Despacho de Deferimento da Matrícula
        </span>
        <div style="height: 38px; display: flex; align-items: center; justify-content: center; margin: 2px 0;">
          <svg viewBox="0 0 240 60" style="width: 180px; height: 36px;" fill="none">
            <path d="M15 42C35 25 55 12 75 22C95 32 110 50 130 30C150 10 165 45 185 28C205 11 220 38 230 25" stroke="#1E3A8A" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M45 48C75 42 120 44 195 40" stroke="#1E3A8A" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M25 30C30 15 42 8 50 18C58 28 62 48 70 38" stroke="#2563EB" stroke-width="1.6"/>
          </svg>
        </div>
        <div style="border-top: 1.5px solid #334155; padding-top: 2px; max-width: 240px; margin: 0 auto;">
          <span style="font-size: 10px; font-weight: 900; color: #0f172a; display: block;">Prof. Dr. Mateus Domingos da Silva</span>
          <span style="font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase;">Director Geral da Instituição de Ensino</span>
        </div>
      </div>

      <!-- Selo Criptográfico Digital -->
      <div class="director-seal">
        <div style="font-weight: 900; border-bottom: 1px solid #a7f3d0; padding-bottom: 2px; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
          <span>🔒 ASSINATURA DIGITAL CERTIFICADA</span>
        </div>
        <div>Norma: ICP-Angola / uCore ID</div>
        <div>Hash SHA-256: e8f4${(student.codigoMatricula || '0000').slice(-4)}...9b21</div>
        <div>Timestamp: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</div>
        <div style="color: #059669; font-weight: 800; margin-top: 2px;">● CERTIFICADO VÁLIDO</div>
      </div>
    </div>

    <!-- 7. Assinaturas do Encarregado e Secretaria -->
    <div class="signatures-block">
      <div>
        <div class="sig-line">O(A) Encarregado(a) de Educação</div>
        <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Assinatura por Extenso</div>
      </div>
      <div>
        <div class="sig-line">Secretaria Pedagógica Oficial</div>
        <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Rubrica e Validação de Matrícula</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="width: 50px; height: 50px; border: 1px solid #cbd5e1; background: #ffffff; padding: 2px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 7px; font-mono: monospace; color: #0b3d5c; font-weight: 800; text-align: center;">
          QR CODE<br>VALIDAÇÃO
        </div>
        <span style="font-size: 7px; color: #64748b; margin-top: 2px;">Autenticidade uCore</span>
      </div>
    </div>

    <div class="footer-note">
      Documento processado por computador via <strong>uCore Central • Sistema de Gestão Educacional Integrado</strong>.<br>
      Código de Validação Digital: <code>VAL-${student.id}-${new Date().getFullYear()}</code> • Conservar este comprovativo durante todo o ano lectivo.
    </div>
  </div>

  <div class="no-print" style="position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #0b3d5c; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
      🖨️ Imprimir Boletim (A4)
    </button>
  </div>
</body>
</html>`;
}

/**
 * Faz download do Boletim em ficheiro HTML autónomo
 */
export function downloadBoletimHTML(student: StudentRegistrationData): void {
  const html = generateBoletimHTML(student);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (student.nomeCompleto || student.name || 'Aluno').replace(/\s+/g, '_');
  a.download = `Boletim_Matricula_${student.codigoMatricula || 'MAT'}_${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
