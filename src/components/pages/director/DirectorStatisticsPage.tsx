import React, { useState } from 'react';
import { Hero } from '../../Hero';
import { directorStatsData } from '../../../data/directorData';
import { initialStudentsData } from '../../../data/teacherData';
import { StatCardItem } from '../../StatCardItem';
import { GenderDonutChart } from '../../charts/GenderDonutChart';
import { PerformanceBarChart } from '../../charts/PerformanceBarChart';
import { AttendanceAreaChart } from '../../charts/AttendanceAreaChart';
import { DocumentStatusChart } from '../../charts/DocumentStatusChart';
import { ChartDrillDownModal, DrillDownFilter } from '../../charts/ChartDrillDownModal';
import { SchoolAnnouncementsBanner } from '../../announcements/SchoolAnnouncementsBanner';

interface DirectorStatisticsPageProps {
  onOpenGetStarted: () => void;
  onNavigateToRooms: () => void;
  onNavigateToTeachers: () => void;
  onNavigateToStudents: () => void;
  isLoggedIn?: boolean;
}

export const DirectorStatisticsPage: React.FC<DirectorStatisticsPageProps> = ({
  onOpenGetStarted,
  onNavigateToRooms,
  onNavigateToTeachers,
  onNavigateToStudents,
  isLoggedIn,
}) => {
  const [drillDownFilter, setDrillDownFilter] = useState<DrillDownFilter | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  const openFilter = (filter: DrillDownFilter) => {
    setDrillDownFilter(filter);
    setIsDrillDownOpen(true);
  };

  return (
    <div id="director-statistics-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Interactive Drill Down Modal */}
      <ChartDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        filter={drillDownFilter}
        students={initialStudentsData}
        onSelectStudent={() => {
          setIsDrillDownOpen(false);
          onNavigateToStudents();
        }}
      />

      {/* Hero: "Analisa as suas estatísticas" matching 5.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Analisa as suas estatísticas"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Institutional Announcements Banner for Directors */}
        <SchoolAnnouncementsBanner
          title="Editais, Prazos & Circulares Oficiais da Rede"
          className="mb-10 shadow-xs"
          onActionClick={(ad) => {
            if (ad.demandType === 'matriculas') {
              onNavigateToStudents();
            } else if (ad.demandType === 'notas') {
              onNavigateToStudents();
            }
          }}
        />

        {/* Metric Cards featuring harmonious equal-height cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mb-14 items-stretch">
          <StatCardItem
            id="dir-stat-card-alunos"
            card={{
              id: 'alunos',
              title: 'Nº Alunos',
              value: '0',
              icon: 'users',
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: 'Matrículas Regulares',
            }}
            onSelect={onNavigateToStudents}
          />
          <StatCardItem
            id="dir-stat-card-turmas"
            card={{
              id: 'turmas',
              title: 'Nº Turmas',
              value: '0',
              icon: 'home',
              isClickable: false,
              subtitle: 'Turmas Ativas na Unidade',
            }}
          />
          <StatCardItem
            id="dir-stat-card-salas"
            card={{
              id: 'salas',
              title: 'Salas',
              value: '0',
              icon: 'home',
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: 'Espaços Físicos',
            }}
            onSelect={onNavigateToRooms}
          />
          <StatCardItem
            id="dir-stat-card-professores"
            card={{
              id: 'professores',
              title: 'Professores',
              value: '0',
              icon: 'user',
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: 'Quadro Docente Ativo',
            }}
            onSelect={onNavigateToTeachers}
          />
        </div>

        {/* Statistical Visualizers Grid reproducing exact layout in 5.png with modern interactive charts */}
        <div className="space-y-8">
          {/* Row 1: [Alunos - Donut/Colunas] + [Desempenho - Colunas/Linhas] + [Presença - Área/Colunas] */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Chart 1: [Alunos] (Gênero) */}
            <GenderDonutChart
              femaleCount={directorStatsData.genderData.femaleCount}
              maleCount={directorStatsData.genderData.maleCount}
              totalCount={directorStatsData.genderData.femaleCount + directorStatsData.genderData.maleCount}
              title="Gênero dos Alunos"
              badgeText="Alunos"
              subtitle="Distribuição de alunos da escola por gênero"
              onSelectGender={(gender) => {
                openFilter({
                  type: 'gender',
                  value: gender,
                  title: `Estudantes do Gênero ${gender}`,
                  subtitle: `Alunos da instituição cadastrados no sistema`,
                });
              }}
            />

            {/* Chart 2: [Desempenho dos alunos] */}
            <PerformanceBarChart
              data={directorStatsData.academicPerformance.map((item) => ({
                period: item.semester,
                aprovacao: item.approval,
                reprovacao: item.reproval,
                distincao: 0,
                regular: 0,
                recuperacao: 0,
                totalAvaliados: 0,
              }))}
              title="Desempenho da Unidade"
              badgeText="Desempenho dos alunos"
              subtitle="Rendimento acadêmico por semestre avaliativo"
              targetRate={80}
              onOpenDrillDown={(period) => {
                openFilter({
                  type: 'performance',
                  value: 'aprovados',
                  title: `Desempenho Acadêmico • ${period}`,
                  subtitle: `Rendimento escolar verificado no período ${period}`,
                });
              }}
            />

            {/* Chart 3: [Presença] */}
            <AttendanceAreaChart
              data={[
                { year: '2022', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
                { year: '2023', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
                { year: '2024', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
                { year: '2025', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
                { year: '2026', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
              ]}
              title="Presença & Assiduidade"
              badgeText="Presença"
              subtitle="Controle diário de assiduidade na escola"
              averageRate={0}
              onOpenDrillDown={(period) => {
                openFilter({
                  type: 'attendance',
                  value: 'alto',
                  title: `Presença & Assiduidade • ${period}`,
                  subtitle: `Registros de frequência dos alunos no ano de ${period}`,
                });
              }}
            />
          </div>

          {/* Row 2: [Alunos sem documentos] & [Alunos com documentos] matching bottom of 5.png */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Chart 4: Alunos sem documentos */}
            <DocumentStatusChart
              totalWithDocs={0}
              totalWithoutDocs={0}
              femaleWithDocs={0}
              maleWithDocs={0}
              femaleWithoutDocs={0}
              maleWithoutDocs={0}
              title="Pendências Documentais"
              badgeText="Alunos sem documentos"
              subtitle="Alunos em processo de emissão de cédula ou BI"
              isFocusWithoutDocs={true}
              onSelectDocStatus={(status) => {
                openFilter({
                  type: 'docs',
                  value: status,
                  title: status === 'sem_docs' ? 'Pendências de Documentos' : 'Documentos Regularizados',
                  subtitle: `Alunos identificados no censo documental da escola`,
                });
              }}
            />

            {/* Chart 5: Alunos com documentos */}
            <DocumentStatusChart
              totalWithDocs={0}
              totalWithoutDocs={0}
              femaleWithDocs={0}
              maleWithDocs={0}
              femaleWithoutDocs={0}
              maleWithoutDocs={0}
              title="Regularidade Registral"
              badgeText="Alunos com documentos"
              subtitle="Documentação completa validada pela secretaria"
              isFocusWithoutDocs={false}
              onSelectDocStatus={(status) => {
                openFilter({
                  type: 'docs',
                  value: status,
                  title: status === 'com_docs' ? 'Documentos Regularizados' : 'Pendências de Documentos',
                  subtitle: `Alunos com documentação civil completa validada`,
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
