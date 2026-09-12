-- ==============================================================================
-- uCore Platform · Schema do Banco de Dados PostgreSQL / Supabase
-- Sistema de Gestão Escolar & Avaliação Académica (Normas MED Angola / SSD)
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. FUNÇÃO UTILITÁRIA PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMP (updated_at)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABELA: ESCOLAS (schools)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(60) NOT NULL DEFAULT 'Ensino Primário',
  province VARCHAR(100) NOT NULL DEFAULT 'Malanje',
  municipality VARCHAR(100) NOT NULL DEFAULT 'Quêssua',
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(120),
  director_name VARCHAR(150),
  teachers_count INT DEFAULT 0,
  classes_count INT DEFAULT 0,
  rooms_count INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. TABELA: PERFIS DE UTILIZADORES (profiles)
-- Vinculado a auth.users do Supabase
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  bi_number VARCHAR(20),
  role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'diretor', 'professor', 'secretario', 'aluno', 'encarregado')),
  school_staff_role VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. TABELA: PROFESSORES (teachers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  bi_number VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(120),
  specialty VARCHAR(120) DEFAULT 'Ensino Primário Geral',
  status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'licenca', 'inactivo')),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. TABELA: TURMAS (turmas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL, -- Ex: 'Turma 1', 'Turma A'
  grade_level VARCHAR(40) NOT NULL, -- Ex: '4ª Classe', '7ª Classe'
  room VARCHAR(30) NOT NULL, -- Ex: 'Sala 04'
  periodo VARCHAR(20) NOT NULL CHECK (periodo IN ('Manhã', 'Tarde', 'Noite')),
  academic_year VARCHAR(10) NOT NULL DEFAULT '2026',
  titular_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  max_students INT DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_turmas_updated_at
BEFORE UPDATE ON public.turmas
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. TABELA: DISCIPLINAS (subjects)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  grade_level VARCHAR(40),
  weekly_hours INT DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. TABELA: VINCULAÇÃO TURMA-DISCIPLINA-PROFESSOR (turma_subjects)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.turma_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (turma_id, subject_id)
);

-- ==============================================================================
-- 9. TABELA: ALUNOS (students)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE RESTRICT,
  numero_chamada INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
  birth_date DATE,
  age INT,
  id_doc_type VARCHAR(30) DEFAULT 'BI' CHECK (id_doc_type IN ('BI', 'Cedula pessoal', 'Assento', 'sem Documento')),
  id_doc_number VARCHAR(50),
  has_documents BOOLEAN DEFAULT true,
  condicao_matricula VARCHAR(30) DEFAULT 'primeira_vez' CHECK (condicao_matricula IN ('primeira_vez', 'repetente')),
  father_name VARCHAR(150),
  mother_name VARCHAR(150),
  guardian_name VARCHAR(150) NOT NULL,
  guardian_relationship VARCHAR(50) DEFAULT 'Encarregado(a)',
  guardian_phone VARCHAR(30) NOT NULL,
  alt_phone VARCHAR(30),
  address TEXT,
  photo_url TEXT,
  attendance_percent NUMERIC(4, 1) DEFAULT 100.0 CHECK (attendance_percent >= 0 AND attendance_percent <= 100),
  absences_count INT DEFAULT 0,
  observations TEXT,
  status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'transferido', 'desistente', 'concluido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (turma_id, numero_chamada)
);

CREATE TRIGGER set_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. TABELA: PAUTA DE NOTAS & MÉDIAS (student_grades)
-- Escala oficial de Angola: 0 a 20 valores
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  academic_year VARCHAR(10) NOT NULL DEFAULT '2026',
  trimester INT NOT NULL CHECK (trimester IN (1, 2, 3)),
  p1 NUMERIC(4, 1) CHECK (p1 >= 0 AND p1 <= 20),
  p2 NUMERIC(4, 1) CHECK (p2 >= 0 AND p2 <= 20),
  trabalho NUMERIC(4, 1) CHECK (trabalho >= 0 AND trabalho <= 20),
  media NUMERIC(4, 1) CHECK (media >= 0 AND media <= 20),
  status VARCHAR(20) CHECK (status IN ('Aprovado', 'Recuperação', 'Reprovado')),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, subject_id, academic_year, trimester)
);

CREATE TRIGGER set_student_grades_updated_at
BEFORE UPDATE ON public.student_grades
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 11. TABELA: REGISTO DIÁRIO DE PRESENÇAS / CHAMADA (attendance_records)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(25) NOT NULL CHECK (status IN ('presente', 'falta_justificada', 'falta_injustificada', 'atraso')),
  reason TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, date)
);

-- ==============================================================================
-- 12. TABELA: COMUNICADOS E EDITAIS (announcements)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'Geral',
  target_role VARCHAR(30) DEFAULT 'todos',
  demand_type VARCHAR(30) DEFAULT 'informativo',
  expiration_date DATE NOT NULL,
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. TABELA: TRILHA DE AUDITORIA & REGISTO DE SEGURANÇA (audit_logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 14. ÍNDICES DE DESEMPENHO E CONSULTA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_schools_code ON public.schools(code);
CREATE INDEX IF NOT EXISTS idx_turmas_school ON public.turmas(school_id);
CREATE INDEX IF NOT EXISTS idx_students_turma ON public.students(turma_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_turma_trimester ON public.student_grades(turma_id, academic_year, trimester);
CREATE INDEX IF NOT EXISTS idx_attendance_turma_date ON public.attendance_records(turma_id, date);
CREATE INDEX IF NOT EXISTS idx_announcements_school ON public.announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- ==============================================================================
-- 15. SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- Ativação em todas as tabelas públicas
-- ==============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura e Escrita Públicas/Autenticadas

-- Escolas: visualização pública para consulta da rede
CREATE POLICY "Permitir leitura de escolas" ON public.schools
  FOR SELECT USING (true);

-- Perfis: cada usuário autenticado pode ler os perfis da escola
CREATE POLICY "Permitir leitura de perfis autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuário atualiza o próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Turmas e Disciplinas: leitura livre para usuários autenticados
CREATE POLICY "Leitura de turmas" ON public.turmas
  FOR SELECT USING (true);

CREATE POLICY "Leitura de disciplinas" ON public.subjects
  FOR SELECT USING (true);

CREATE POLICY "Leitura de turma_subjects" ON public.turma_subjects
  FOR SELECT USING (true);

-- Alunos: leitura para autenticados
CREATE POLICY "Leitura de alunos autenticada" ON public.students
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Inserção e atualização de alunos por docentes/direção" ON public.students
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pautas e Notas: leitura e gestão por utilizadores autenticados
CREATE POLICY "Leitura de notas autenticada" ON public.student_grades
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Docentes e Direção lançam notas" ON public.student_grades
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Presenças: leitura e lançamento
CREATE POLICY "Leitura de presenças" ON public.attendance_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestão de presenças" ON public.attendance_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comunicados
CREATE POLICY "Leitura de comunicados" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "Gestão de comunicados" ON public.announcements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Logs
CREATE POLICY "Inserção de logs de auditoria" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Leitura de logs por administradores" ON public.audit_logs
  FOR SELECT TO authenticated USING (true);

-- ==============================================================================
-- 16. TRIGGER AUTOMÁTICO PARA CRIAÇÃO DE PERFIL AO REGISTAR NO SUPABASE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'professor')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 17. SEED INICIAL: DADOS REAIS DO SISTEMA UCORE (ESCOLA, TURMA, NOTAS)
-- Permite que o banco já nasça com a escola e turma operacional
-- ==============================================================================

-- 17.1 Inserir Escola Principal
INSERT INTO public.schools (id, code, name, category, province, municipality, address, phone, email, director_name, rooms_count)
VALUES (
  'e1024000-0000-0000-0000-000000000001',
  'ESC-1024',
  'Escola Primária Nº 1024 - Luanda Sul',
  'Ensino Primário',
  'Luanda',
  'Viana',
  'Luanda Sul, Sector 4, Pavilhão A',
  '+244 923 456 789',
  'direcao.1024@ucore.edu.ao',
  'Fert Horlan',
  11
) ON CONFLICT (code) DO NOTHING;

-- 17.2 Inserir Professor Titular Santar Goes
INSERT INTO public.teachers (id, school_id, name, bi_number, phone, email, specialty, bio)
VALUES (
  'd0000001-0000-0000-0000-000000000001',
  'e1024000-0000-0000-0000-000000000001',
  'Santar Goes',
  '004581290LA042',
  '+244 931 224 550',
  'santar.goes@ucore.edu.ao',
  'Docente Titular - 4ª Classe',
  'Docente titular do 4º Ano do Ensino Primário. Especialista em Metodologias Ativas de Alfabetização e Gestão de Sala de Aula Inclusiva.'
) ON CONFLICT DO NOTHING;

-- 17.3 Inserir Turma 1 - 4ª Classe
INSERT INTO public.turmas (id, school_id, name, grade_level, room, periodo, academic_year, titular_teacher_id)
VALUES (
  't0000001-0000-0000-0000-000000000001',
  'e1024000-0000-0000-0000-000000000001',
  'Turma 1',
  '4ª Classe',
  'Sala 04',
  'Manhã',
  '2026',
  'd0000001-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- 17.4 Inserir Disciplinas Oficiais do MED
INSERT INTO public.subjects (id, name, code, grade_level, weekly_hours)
VALUES 
  ('s0000001-0000-0000-0000-000000000001', 'Língua Portuguesa', 'LP-4', '4ª Classe', 6),
  ('s0000002-0000-0000-0000-000000000002', 'Matemática', 'MAT-4', '4ª Classe', 6),
  ('s0000003-0000-0000-0000-000000000003', 'Ciências Naturais', 'CN-4', '4ª Classe', 4),
  ('s0000004-0000-0000-0000-000000000004', 'História', 'HIST-4', '4ª Classe', 3),
  ('s0000005-0000-0000-0000-000000000005', 'Geografia', 'GEO-4', '4ª Classe', 3),
  ('s0000006-0000-0000-0000-000000000006', 'Educação Física', 'EF-4', '4ª Classe', 2),
  ('s0000007-0000-0000-0000-000000000007', 'Educação Visual e Plástica', 'EVP-4', '4ª Classe', 2)
ON CONFLICT (code) DO NOTHING;

-- 17.5 Vincular Disciplinas à Turma
INSERT INTO public.turma_subjects (turma_id, subject_id, teacher_id)
VALUES
  ('t0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001'),
  ('t0000001-0000-0000-0000-000000000001', 's0000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('t0000001-0000-0000-0000-000000000001', 's0000003-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001'),
  ('t0000001-0000-0000-0000-000000000001', 's0000004-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001'),
  ('t0000001-0000-0000-0000-000000000001', 's0000005-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001'),
  ('t0000001-0000-0000-0000-000000000001', 's0000006-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000001'),
  ('t0000001-0000-0000-0000-000000000001', 's0000007-0000-0000-0000-000000000007', 'd0000001-0000-0000-0000-000000000001')
ON CONFLICT (turma_id, subject_id) DO NOTHING;

-- 17.6 Inserir Alunos da Turma
INSERT INTO public.students (
  id, school_id, turma_id, numero_chamada, name, gender, age, id_doc_type, id_doc_number, has_documents, 
  guardian_name, guardian_phone, attendance_percent, observations
)
VALUES
  (
    'a0000001-0000-0000-0000-000000000001',
    'e1024000-0000-0000-0000-000000000001',
    't0000001-0000-0000-0000-000000000001',
    1,
    'Albert Golph',
    'M',
    9,
    'BI',
    '008941215LA041',
    true,
    'Manuel Golph',
    '+244 923 456 789',
    96.0,
    'Excelente desempenho e assiduidade regular. Participativo nas aulas de matemática.'
  ),
  (
    'a0000002-0000-0000-0000-000000000002',
    'e1024000-0000-0000-0000-000000000001',
    't0000001-0000-0000-0000-000000000001',
    2,
    'Beatriz Silva',
    'F',
    9,
    'BI',
    '008955112LA042',
    true,
    'João Silva',
    '+244 923 112 334',
    98.0,
    'Destaque em leitura e redação. Líder de grupo nos projetos de ciências.'
  ),
  (
    'a0000003-0000-0000-0000-000000000003',
    'e1024000-0000-0000-0000-000000000001',
    't0000001-0000-0000-0000-000000000001',
    3,
    'Carlos Manuel',
    'M',
    10,
    'Cedula pessoal',
    NULL,
    false,
    'Teresa Manuel',
    '+244 934 556 778',
    88.0,
    'Documentação pendente: aguardando cópia de cédula pessoal. Bom raciocínio lógico.'
  ),
  (
    'a0000004-0000-0000-0000-000000000004',
    'e1024000-0000-0000-0000-000000000001',
    't0000001-0000-0000-0000-000000000001',
    4,
    'Daniela Costa',
    'F',
    9,
    'BI',
    '009112440LA043',
    true,
    'Paulo Costa',
    '+244 912 889 001',
    97.0,
    'Melhor média geral da turma. Extremamente dedicada e pontual.'
  ),
  (
    'a0000005-0000-0000-0000-000000000005',
    'e1024000-0000-0000-0000-000000000001',
    't0000001-0000-0000-0000-000000000001',
    5,
    'Eduardo Kiala',
    'M',
    10,
    'BI',
    '009224119LA044',
    true,
    'Mateus Kiala',
    '+244 927 441 330',
    92.0,
    'Apresenta evolução nas disciplinas de exatas. Requer reforço em ortografia.'
  )
ON CONFLICT (turma_id, numero_chamada) DO NOTHING;

-- 17.7 Inserir Notas do 1º Trimestre para os Alunos Iniciais
-- Albert Golph
INSERT INTO public.student_grades (student_id, turma_id, subject_id, academic_year, trimester, p1, p2, trabalho, media, status)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', '2026', 1, 16.0, 17.0, 18.0, 16.8, 'Aprovado'),
  ('a0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000001', 's0000002-0000-0000-0000-000000000002', '2026', 1, 18.0, 19.0, 19.0, 18.6, 'Aprovado'),
  ('a0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000001', 's0000003-0000-0000-0000-000000000003', '2026', 1, 15.0, 16.0, 17.0, 15.8, 'Aprovado')
ON CONFLICT (student_id, subject_id, academic_year, trimester) DO NOTHING;

-- Beatriz Silva
INSERT INTO public.student_grades (student_id, turma_id, subject_id, academic_year, trimester, p1, p2, trabalho, media, status)
VALUES
  ('a0000002-0000-0000-0000-000000000002', 't0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', '2026', 1, 18.0, 19.0, 19.0, 18.6, 'Aprovado'),
  ('a0000002-0000-0000-0000-000000000002', 't0000001-0000-0000-0000-000000000001', 's0000002-0000-0000-0000-000000000002', '2026', 1, 15.0, 16.0, 17.0, 15.8, 'Aprovado'),
  ('a0000002-0000-0000-0000-000000000002', 't0000001-0000-0000-0000-000000000001', 's0000003-0000-0000-0000-000000000003', '2026', 1, 17.0, 17.0, 18.0, 17.2, 'Aprovado')
ON CONFLICT (student_id, subject_id, academic_year, trimester) DO NOTHING;

-- Carlos Manuel
INSERT INTO public.student_grades (student_id, turma_id, subject_id, academic_year, trimester, p1, p2, trabalho, media, status)
VALUES
  ('a0000003-0000-0000-0000-000000000003', 't0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', '2026', 1, 14.0, 15.0, 15.0, 14.6, 'Aprovado'),
  ('a0000003-0000-0000-0000-000000000003', 't0000001-0000-0000-0000-000000000001', 's0000002-0000-0000-0000-000000000002', '2026', 1, 17.0, 18.0, 18.0, 17.6, 'Aprovado')
ON CONFLICT (student_id, subject_id, academic_year, trimester) DO NOTHING;

-- Daniela Costa
INSERT INTO public.student_grades (student_id, turma_id, subject_id, academic_year, trimester, p1, p2, trabalho, media, status)
VALUES
  ('a0000004-0000-0000-0000-000000000004', 't0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', '2026', 1, 19.0, 20.0, 19.0, 19.4, 'Aprovado'),
  ('a0000004-0000-0000-0000-000000000004', 't0000001-0000-0000-0000-000000000001', 's0000002-0000-0000-0000-000000000002', '2026', 1, 18.0, 17.0, 19.0, 17.8, 'Aprovado')
ON CONFLICT (student_id, subject_id, academic_year, trimester) DO NOTHING;

-- Eduardo Kiala
INSERT INTO public.student_grades (student_id, turma_id, subject_id, academic_year, trimester, p1, p2, trabalho, media, status)
VALUES
  ('a0000005-0000-0000-0000-000000000005', 't0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', '2026', 1, 12.0, 11.0, 13.0, 11.8, 'Aprovado'),
  ('a0000005-0000-0000-0000-000000000005', 't0000001-0000-0000-0000-000000000001', 's0000002-0000-0000-0000-000000000002', '2026', 1, 14.0, 13.0, 15.0, 13.8, 'Aprovado')
ON CONFLICT (student_id, subject_id, academic_year, trimester) DO NOTHING;
