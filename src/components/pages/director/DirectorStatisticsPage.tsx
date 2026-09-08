import React from 'react';
import { Hero } from '../../Hero';
import { directorStatsData } from '../../../data/directorData';
import { StatCardItem } from '../../StatCardItem';
import { GenderDonutChart } from '../../charts/GenderDonutChart';
import { PerformanceBarChart } from '../../charts/PerformanceBarChart';
import { AttendanceAreaChart } from '../../charts/AttendanceAreaChart';
import { DocumentStatusChart } from '../../charts/DocumentStatusChart';
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
  return (
    <div id="director-statistics-page" className="w-full min-h-screen bg-[#f7f3f3]">
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
              value: '489',
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
              value: '14',
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
              value: '11',
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
              value: '23',
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
            />

            {/* Chart 2: [Desempenho dos alunos] (2017.1 to 2019.2) */}
            <PerformanceBarChart
              data={directorStatsData.academicPerformance.map((item) => ({
                period: item.semester,
                aprovacao: item.approval,
                reprovacao: item.reproval,
              }))}
              title="Desempenho da Unidade"
              badgeText="Desempenho dos alunos"
              subtitle="Rendimento acadêmico por semestre avaliativo"
              targetRate={80}
            />

            {/* Chart 3: [Presença] (EAD vs Presencial Trend lines / Area) */}
            <AttendanceAreaChart
              data={[
                { year: '2009', presencial: 95, ead: 60 },
                { year: '2013', presencial: 94, ead: 65 },
                { year: '2016', presencial: 95, ead: 75 },
                { year: '2019', presencial: 96, ead: 80 },
                { year: '2023', presencial: 97, ead: 72 },
                { year: '2026', presencial: 98, ead: 70 },
              ]}
              title="Presença & Assiduidade"
              badgeText="Presença"
              subtitle="Controle diário de assiduidade na escola"
              averageRate={97.2}
            />
          </div>

          {/* Row 2: [Alunos sem documentos] & [Alunos com documentos] matching bottom of 5.png */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Chart 4: Alunos sem documentos */}
            <DocumentStatusChart
              totalWithDocs={4310}
              totalWithoutDocs={741}
              femaleWithDocs={4310}
              maleWithDocs={0}
              femaleWithoutDocs={0}
              maleWithoutDocs={741}
              title="Pendências Documentais"
              badgeText="Alunos sem documentos"
              subtitle="Alunos em processo de emissão de cédula ou BI"
              isFocusWithoutDocs={true}
            />

            {/* Chart 5: Alunos com documentos */}
            <DocumentStatusChart
              totalWithDocs={4310}
              totalWithoutDocs={741}
              femaleWithDocs={4310}
              maleWithDocs={0}
              femaleWithoutDocs={0}
              maleWithoutDocs={741}
              title="Regularidade Registral"
              badgeText="Alunos com documentos"
              subtitle="Documentação completa validada pela secretaria"
              isFocusWithoutDocs={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
