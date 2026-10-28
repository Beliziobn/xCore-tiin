import React from "react";
import SchoolTeamSection, {
  type SchoolMember,
} from "../../src/components/ui/school-team-section";

const schoolMembers: SchoolMember[] = [
  {
    id: "1",
    name: "Ana Maria",
    role: "Diretora Geral",
    photo: "/team/ana-maria.jpg",
    department: "Direção",
    bio: "Responsável pela gestão geral da instituição, acompanhamento pedagógico e coordenação da equipa escolar.",
  },
  {
    id: "2",
    name: "Carlos Manuel",
    role: "Professor de Matemática",
    photo: "/team/carlos-manuel.jpg",
    department: "Ciências Exatas",
    subject: "Matemática",
    bio: "Professor dedicado ao desenvolvimento do raciocínio lógico e da aprendizagem matemática.",
  },
  {
    id: "3",
    name: "João Sebastião",
    role: "Professor de Física",
    photo: "/team/joao-sebastiao.jpg",
    department: "Ciências Exatas",
    subject: "Física",
  },
  {
    id: "4",
    name: "Maria José",
    role: "Coordenadora Pedagógica",
    photo: "/team/maria-jose.jpg",
    department: "Coordenação Pedagógica",
  },
  {
    id: "5",
    name: "Pedro António",
    role: "Professor de Língua Portuguesa",
    photo: "/team/pedro-antonio.jpg",
    department: "Línguas e Humanidades",
    subject: "Língua Portuguesa",
  },
  {
    id: "6",
    name: "Isabel Domingos",
    role: "Professora de Biologia",
    photo: "/team/isabel-domingos.jpg",
    department: "Ciências Naturais",
    subject: "Biologia",
  },
  {
    id: "7",
    name: "Manuel Francisco",
    role: "Diretor Pedagógico",
    photo: "/team/manuel-francisco.jpg",
    department: "Direção Pedagógica",
  },
  {
    id: "8",
    name: "Teresa Paulo",
    role: "Professora de História",
    photo: "/team/teresa-paulo.jpg",
    department: "Ciências Humanas",
    subject: "História",
  },
  {
    id: "9",
    name: "Daniel António",
    role: "Professor de Química",
    photo: "/team/daniel-antonio.jpg",
    department: "Ciências Exatas",
    subject: "Química",
  },
];

export default function Demo() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SchoolTeamSection
        members={schoolMembers}
        title="Conheça a nossa equipa"
        subtitle="Professores, coordenadores e gestores dedicados ao sucesso dos nossos alunos."
      />
    </div>
  );
}
