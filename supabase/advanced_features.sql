-- ==============================================================================
-- uCore Platform · Recursos Avançados do Supabase (Parte 2)
-- Storage, Sincronização em Tempo Real (Realtime), Views de Pauta & Triggers Automáticos
-- ==============================================================================

-- ==============================================================================
-- 1. ATIVAÇÃO DO SUPABASE REALTIME
-- Permite que alterações de notas, presenças e novos alunos sincronizem
-- instantaneamente na tela sem precisar recarregar a página (F5)
-- ==============================================================================
BEGIN;
  -- Adiciona tabelas principais à publicação oficial do Supabase Realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.student_grades;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
COMMIT;

-- ==============================================================================
-- 2. SUPABASE STORAGE: BUCKETS PARA FOTOS E DOCUMENTOS DOS ALUNOS
-- Cria os repositórios para fotos de perfil, bilhetes de identidade e relatórios
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('student-photos', 'student-photos', true),
  ('student-documents', 'student-documents', false),
  ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao Storage (Fotos públicas para exibição na lista)
CREATE POLICY "Fotos dos alunos acessíveis publicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

CREATE POLICY "Upload de fotos por usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-photos');

-- Documentos dos alunos (Protegidos: apenas autenticados podem ver/subir)
CREATE POLICY "Visualização de documentos por pessoal autorizado"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'student-documents');

CREATE POLICY "Upload de documentos escolares por pessoal autorizado"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-documents');

-- ==============================================================================
-- 3. VIEW INTELIGENTE: PAUTA CONSOLIDADA COM MÉDIAS (vw_pauta_turma)
-- Calcula automaticamente médias, quadro de honra e situação do aluno
-- ==============================================================================
CREATE OR REPLACE VIEW public.vw_pauta_turma AS
SELECT 
  s.id AS student_id,
  s.turma_id,
  s.school_id,
  s.numero_chamada,
  s.name AS student_name,
  s.gender,
  s.attendance_percent,
  s.has_documents,
  ROUND(AVG(g.media), 1) AS media_geral,
  COUNT(g.id) AS total_disciplinas_avaliadas,
  CASE
    WHEN AVG(g.media) >= 16.0 THEN 'Quadro de Honra'
    WHEN AVG(g.media) >= 10.0 THEN 'Aprovado'
    WHEN AVG(g.media) < 10.0 THEN 'Reprovado'
    ELSE 'Pendente'
  END AS situacao_academica
FROM public.students s
LEFT JOIN public.student_grades g ON s.id = g.student_id
GROUP BY s.id, s.turma_id, s.school_id, s.numero_chamada, s.name, s.gender, s.attendance_percent, s.has_documents
ORDER BY s.numero_chamada ASC;

-- ==============================================================================
-- 4. VIEW INTELIGENTE: RESUMO ESTATÍSTICO DA TURMA (vw_estatisticas_turma)
-- Métricas executivas para o painel do professor e do diretor
-- ==============================================================================
CREATE OR REPLACE VIEW public.vw_estatisticas_turma AS
SELECT 
  t.id AS turma_id,
  t.name AS turma_name,
  t.grade_level,
  t.room,
  t.periodo,
  COUNT(DISTINCT s.id) AS total_matriculados,
  COUNT(DISTINCT CASE WHEN s.has_documents = true THEN s.id END) AS com_documentos,
  COUNT(DISTINCT CASE WHEN s.has_documents = false THEN s.id END) AS sem_documentos,
  ROUND(AVG(s.attendance_percent), 1) AS media_presenca_turma,
  ROUND(AVG(g.media), 1) AS media_academica_turma
FROM public.turmas t
LEFT JOIN public.students s ON t.id = s.turma_id
LEFT JOIN public.student_grades g ON s.id = g.student_id
GROUP BY t.id, t.name, t.grade_level, t.room, t.periodo;

-- ==============================================================================
-- 5. TRIGGER AUTOMÁTICO: ATUALIZAÇÃO DA % DE PRESENÇA NO ALUNO
-- Sempre que uma presença ou falta for registrada, recalcula a % de assiduidade
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.recalcular_presenca_aluno()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_total_dias INT;
  v_presencas INT;
  v_faltas INT;
  v_percent NUMERIC(4, 1);
BEGIN
  v_student_id := COALESCE(NEW.student_id, OLD.student_id);

  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status IN ('presente', 'atraso') THEN 1 END),
    COUNT(CASE WHEN status = 'falta_injustificada' THEN 1 END)
  INTO v_total_dias, v_presencas, v_faltas
  FROM public.attendance_records
  WHERE student_id = v_student_id;

  IF v_total_dias > 0 THEN
    v_percent := ROUND((v_presencas::NUMERIC / v_total_dias::NUMERIC) * 100, 1);
  ELSE
    v_percent := 100.0;
  END IF;

  UPDATE public.students
  SET 
    attendance_percent = v_percent,
    absences_count = v_faltas,
    updated_at = NOW()
  WHERE id = v_student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_presenca_aluno ON public.attendance_records;
CREATE TRIGGER trigger_atualizar_presenca_aluno
AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.recalcular_presenca_aluno();
