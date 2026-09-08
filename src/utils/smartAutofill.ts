import { getStoredDirectors } from './directorStorage';
import { getStoredTeachers } from './teacherStorage';
import { getStoredStudents } from './studentStorage';
import type { UserAccount } from '../types';

export interface AutofillProfile {
  id: string;
  label: string;
  subtitle: string;
  source: 'active_session' | 'director' | 'teacher' | 'guardian' | 'preset';
  fullName: string;
  documentNumber: string;
  documentType: 'BI' | 'Cédula Pessoal' | 'Certidão de Nascimento' | 'Outro';
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
  phoneAlternative?: string;
  email: string;
  address: string;
  bairro: string;
  comuna: string;
  municipality: string;
  province: string;
  schoolName: string;
  guardianName: string;
  guardianRelationship: string;
  jobTitle: string;
}

// Built-in verified Quêssua profiles for instant offline assistance
const PRESET_PROFILES: AutofillProfile[] = [
  {
    id: 'preset-dir-carl',
    label: 'Carl Quêssua (Director Escolar)',
    subtitle: 'Director Titular • Quêssua Sede',
    source: 'preset',
    fullName: 'Carl Quêssua',
    documentNumber: '004812903ME041',
    documentType: 'BI',
    gender: 'M',
    birthDate: '1979-05-14',
    phone: '+244 923 881 920',
    phoneAlternative: '+244 931 445 210',
    email: 'carl.quessua@ucore.edu.ao',
    address: 'Bairro Central, Zona da Missão de Quêssua, Casa 14',
    bairro: 'Central',
    comuna: 'Quêssua Sede',
    municipality: 'Quêssua',
    province: 'Malanje',
    schoolName: 'Escola Modelo Central de Quêssua',
    guardianName: 'Carl Quêssua',
    guardianRelationship: 'Pai',
    jobTitle: 'Director Geral',
  },
  {
    id: 'preset-prof-santar',
    label: 'Prof. Santar Quissola (Docente Titular)',
    subtitle: 'Professor do Ensino Primário e Iº Ciclo',
    source: 'preset',
    fullName: 'Santar Quissola',
    documentNumber: '005921844LA038',
    documentType: 'BI',
    gender: 'M',
    birthDate: '1986-11-22',
    phone: '+244 931 222 333',
    phoneAlternative: '+244 945 889 122',
    email: 'santar.quissola@ucore.edu.ao',
    address: 'Rua Principal dos Professores, Quêssua Sede',
    bairro: 'Pedagógico',
    comuna: 'Quêssua Sede',
    municipality: 'Quêssua',
    province: 'Malanje',
    schoolName: 'Complexo Escolar Quêssua I',
    guardianName: 'Santar Quissola',
    guardianRelationship: 'Tio(a)',
    jobTitle: 'Professor do Quadro Definitivo',
  },
  {
    id: 'preset-enc-fatima',
    label: 'Fátima Ndala (Encarregada de Educação)',
    subtitle: 'Comerciante Local • Bairro Cambaxi',
    source: 'preset',
    fullName: 'Fátima Ndala Domingos',
    documentNumber: '007182940ME029',
    documentType: 'BI',
    gender: 'F',
    birthDate: '1988-03-09',
    phone: '+244 945 771 882',
    phoneAlternative: '+244 912 334 556',
    email: 'fatima.ndala@gmail.com',
    address: 'Bairro Cambaxi, Rua do Mercado Novo, Quêssua',
    bairro: 'Cambaxi',
    comuna: 'Quêssua Sede',
    municipality: 'Quêssua',
    province: 'Malanje',
    schoolName: 'Escola Primária N.º 14 de Cambaxi',
    guardianName: 'Fátima Ndala Domingos',
    guardianRelationship: 'Mãe',
    jobTitle: 'Comerciante / Encarregada',
  },
];

/**
 * Returns a list of autofill candidates based on active session,
 * registered directors, registered teachers, and registered students/guardians.
 */
export function getAutofillProfiles(context: 'student' | 'teacher' | 'director' | 'school' = 'student'): AutofillProfile[] {
  const profiles: AutofillProfile[] = [];

  // 1. Check for Active Logged-in User
  try {
    const rawActive = localStorage.getItem('ucore_active_user');
    if (rawActive) {
      const activeUser = JSON.parse(rawActive) as UserAccount;
      if (activeUser && activeUser.firstName) {
        const full = `${activeUser.firstName} ${activeUser.lastName || ''}`.trim();
        profiles.push({
          id: 'active-session-user',
          label: `Sua Conta Ativa (${full})`,
          subtitle: `Sessão iniciada como ${activeUser.role.toUpperCase()} • Preenchimento instantâneo`,
          source: 'active_session',
          fullName: full,
          documentNumber: activeUser.role === 'diretor' ? '004812903ME041' : '006192843LA021',
          documentType: 'BI',
          gender: 'M',
          birthDate: '1982-07-15',
          phone: '+244 923 881 920',
          phoneAlternative: '+244 931 445 210',
          email: activeUser.email || `${activeUser.firstName.toLowerCase()}@ucore.edu.ao`,
          address: 'Bairro Central, Rua da Missão, Quêssua',
          bairro: 'Central',
          comuna: 'Quêssua Sede',
          municipality: 'Quêssua',
          province: 'Malanje',
          schoolName: 'Escola Modelo Central de Quêssua',
          guardianName: full,
          guardianRelationship: 'Encarregado(a) Legal',
          jobTitle: activeUser.role === 'admin' ? 'Administrador do Sistema' : activeUser.role === 'diretor' ? 'Director(a)' : 'Docente',
        });
      }
    }
  } catch (err) {
    console.warn('Erro ao ler utilizador ativo para autofill:', err);
  }

  // 2. Load Existing Directors
  try {
    const directors = getStoredDirectors();
    if (directors && directors.length > 0) {
      directors.slice(0, 4).forEach((d) => {
        // avoid duplicate if same as active
        if (!profiles.some((p) => p.fullName.toLowerCase() === d.nomeCompleto.toLowerCase())) {
          profiles.push({
            id: `dir-${d.id}`,
            label: `${d.nomeCompleto} (${d.cargo || 'Director'})`,
            subtitle: `${d.nomeEscola} • BI: ${d.biNif || 'Registado'}`,
            source: 'director',
            fullName: d.nomeCompleto,
            documentNumber: d.biNif || '004812903ME041',
            documentType: 'BI',
            gender: d.sexo === 'F' ? 'F' : 'M',
            birthDate: d.dataNascimento || '1978-04-12',
            phone: d.telefone || '+244 923 456 789',
            phoneAlternative: '+244 912 345 678',
            email: d.emailInstitucional || d.emailPessoal || '',
            address: d.morada || 'Bairro Central, Quêssua',
            bairro: 'Central',
            comuna: 'Quêssua Sede',
            municipality: d.municipioResidencia || 'Quêssua',
            province: d.provinciaResidencia || 'Malanje',
            schoolName: d.nomeEscola,
            guardianName: d.nomeCompleto,
            guardianRelationship: 'Pai',
            jobTitle: d.cargo || 'Director(a)',
          });
        }
      });
    }
  } catch (err) {
    console.warn('Erro ao carregar directores para autofill:', err);
  }

  // 3. Load Existing Teachers
  try {
    const teachers = getStoredTeachers();
    if (teachers && teachers.length > 0) {
      teachers.slice(0, 4).forEach((t) => {
        if (!profiles.some((p) => p.fullName.toLowerCase() === t.nomeCompleto.toLowerCase())) {
          profiles.push({
            id: `teacher-${t.id}`,
            label: `${t.nomeCompleto} (Professor)`,
            subtitle: `${t.escolaOrigem || 'Docente'} • ${t.municipioResidencia || 'Quêssua'}`,
            source: 'teacher',
            fullName: t.nomeCompleto,
            documentNumber: t.numeroBI || '005921844LA038',
            documentType: 'BI',
            gender: t.sexo === 'F' ? 'F' : 'M',
            birthDate: t.dataNascimento || '1985-09-20',
            phone: t.telefone || '+244 931 222 333',
            email: t.email || '',
            address: t.morada || 'Bairro dos Professores, Quêssua',
            bairro: 'Pedagógico',
            comuna: 'Quêssua Sede',
            municipality: t.municipioResidencia || 'Quêssua',
            province: t.provinciaResidencia || 'Malanje',
            schoolName: t.escolaOrigem || 'Escola Modelo Central de Quêssua',
            guardianName: t.nomeCompleto,
            guardianRelationship: 'Tio(a)',
            jobTitle: 'Professor',
          });
        }
      });
    }
  } catch (err) {
    console.warn('Erro ao carregar professores para autofill:', err);
  }

  // 4. Load Existing Guardians / Student families
  try {
    const students = getStoredStudents();
    if (students && students.length > 0) {
      students.slice(0, 4).forEach((s) => {
        if (s.encarregado && !profiles.some((p) => p.fullName.toLowerCase() === s.encarregado.toLowerCase())) {
          profiles.push({
            id: `student-guardian-${s.id}`,
            label: `${s.encarregado} (Encarregado de Educação)`,
            subtitle: `Encarregado(a) de ${s.nomeCompleto} • ${s.municipio || 'Quêssua'}`,
            source: 'guardian',
            fullName: s.encarregado,
            documentNumber: s.numeroDocumento || '007182940ME029',
            documentType: s.tipoDocumento === 'BI' ? 'BI' : 'Cédula Pessoal',
            gender: s.parentescoEncarregado?.toLowerCase().includes('mãe') ? 'F' : 'M',
            birthDate: '1984-06-18',
            phone: s.telefone || '+244 945 771 882',
            phoneAlternative: s.telefoneAlternativo,
            email: `${s.encarregado.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
            address: s.endereco || 'Bairro Central, Quêssua',
            bairro: 'Central',
            comuna: 'Quêssua Sede',
            municipality: s.municipio || 'Quêssua',
            province: s.provincia || 'Malanje',
            schoolName: s.escolaOrigem || 'Escola Modelo Central de Quêssua',
            guardianName: s.encarregado,
            guardianRelationship: s.parentescoEncarregado || 'Encarregado(a) Legal',
            jobTitle: 'Encarregado(a) de Educação',
          });
        }
      });
    }
  } catch (err) {
    console.warn('Erro ao carregar alunos para autofill:', err);
  }

  // 5. Append Verified Presets if list is small
  PRESET_PROFILES.forEach((preset) => {
    if (!profiles.some((p) => p.fullName.toLowerCase() === preset.fullName.toLowerCase())) {
      profiles.push(preset);
    }
  });

  // Prioritize according to form context
  if (context === 'student') {
    return profiles.sort((a, b) => {
      if (a.source === 'active_session') return -1;
      if (b.source === 'active_session') return 1;
      if (a.source === 'guardian' && b.source !== 'guardian') return -1;
      if (b.source === 'guardian' && a.source !== 'guardian') return 1;
      return 0;
    });
  } else if (context === 'teacher') {
    return profiles.sort((a, b) => {
      if (a.source === 'active_session') return -1;
      if (b.source === 'active_session') return 1;
      if (a.source === 'teacher' && b.source !== 'teacher') return -1;
      if (b.source === 'teacher' && a.source !== 'teacher') return 1;
      return 0;
    });
  } else if (context === 'director') {
    return profiles.sort((a, b) => {
      if (a.source === 'active_session') return -1;
      if (b.source === 'active_session') return 1;
      if (a.source === 'director' && b.source !== 'director') return -1;
      if (b.source === 'director' && a.source !== 'director') return 1;
      return 0;
    });
  }

  return profiles;
}
