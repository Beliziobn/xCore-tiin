import React from 'react';
import { StudentRegistrationModal } from '../../modals/StudentRegistrationModal';
import { TeacherRegistrationModal } from '../../modals/TeacherRegistrationModal';
import { RoomRegistrationModal } from '../../modals/RoomRegistrationModal';
import { ClassMatrixRegistrationModal } from '../../modals/ClassMatrixRegistrationModal';

interface DirectorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'professores' | 'alunos' | 'salas' | 'classes';
  onSuccess: (newItem: any) => void;
  initialData?: any;
  schoolName?: string;
  directorName?: string;
}

export const DirectorRegistrationModal: React.FC<DirectorRegistrationModalProps> = ({
  isOpen,
  onClose,
  entityType,
  onSuccess,
  initialData,
  schoolName = '',
  directorName = 'Diretor de Escola',
}) => {
  if (!isOpen) return null;

  // If entity is 'alunos', render the comprehensive Student Registration Modal
  if (entityType === 'alunos') {
    return (
      <StudentRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        initialData={initialData}
        defaultGradeClass="4ª Classe"
        defaultTurma="Turma A"
        defaultRoom="Sala 03"
        defaultPeriod="Manhã"
        schoolName={schoolName}
      />
    );
  }

  // If entity is 'professores', render the comprehensive Teacher Registration Modal
  if (entityType === 'professores') {
    return (
      <TeacherRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        initialData={initialData}
        defaultSchoolName={schoolName}
        defaultMunicipality="Quêssua"
        defaultProvince="Malanje"
        authorName={directorName}
        onSuccess={(teacherData) => {
          const firstLevel = teacherData.niveisLecciona[0];
          const resolvedGradeClass = firstLevel?.detalhe
            ? firstLevel.id === 'praeer'
              ? `PRAEER ${firstLevel.detalhe}`
              : firstLevel.detalhe
            : firstLevel?.nome || '1ª Classe';
          const formattedTeacher = {
            id: teacherData.id,
            name: teacherData.nomeCompleto,
            schoolName: teacherData.nomeEscola || schoolName,
            gradeClass: resolvedGradeClass,
            room: 'Sala 03',
            turma: 'Turma A',
            shift: teacherData.turnos[0] || 'Manhã',
            subject: teacherData.disciplinas || 'Educação Geral',
            phone: teacherData.telefone,
            status: 'ativo',
            bi: teacherData.biNif,
            registrationData: teacherData,
          };
          onSuccess(formattedTeacher);
          onClose();
        }}
      />
    );
  }

  // If entity is 'salas', render Cadastrar Nova Sala Escolar modal
  if (entityType === 'salas') {
    return (
      <RoomRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        schoolName={schoolName}
        directorName={directorName}
      />
    );
  }

  // If entity is 'classes', render Cadastrar Nova Matriz de Classe modal
  if (entityType === 'classes') {
    return (
      <ClassMatrixRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        schoolName={schoolName}
        directorName={directorName}
      />
    );
  }

  return null;
};

