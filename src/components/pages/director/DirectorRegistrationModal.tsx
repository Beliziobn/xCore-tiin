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
}

export const DirectorRegistrationModal: React.FC<DirectorRegistrationModalProps> = ({
  isOpen,
  onClose,
  entityType,
  onSuccess,
}) => {
  if (!isOpen) return null;

  // If entity is 'alunos', render the comprehensive Student Registration Modal
  if (entityType === 'alunos') {
    return (
      <StudentRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        defaultGradeClass="4ª Classe"
        defaultTurma="Turma A"
        defaultRoom="Sala 03"
        defaultPeriod="Manhã"
        schoolName="Escola Modelo Central"
      />
    );
  }

  // If entity is 'professores', render the comprehensive Teacher Registration Modal
  if (entityType === 'professores') {
    return (
      <TeacherRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        defaultSchoolName="Escola Modelo Central"
        defaultMunicipality="Quêssua"
        defaultProvince="Malanje"
        authorName="Diretor de Escola"
        onSuccess={(teacherData) => {
          const formattedTeacher = {
            id: teacherData.id,
            name: teacherData.nomeCompleto,
            gradeClass: teacherData.niveisLecciona[0]?.nome || '4ª Classe',
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
        schoolName="Escola Modelo Central"
        directorName="Fert Horlan"
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
        schoolName="Escola Modelo Central"
        directorName="Fert Horlan"
      />
    );
  }

  return null;
};
