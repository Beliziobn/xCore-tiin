import type { AdminSchool } from '../types';

export interface MunicipalitySummary {
  id: string;
  name: string;
  schoolsCount: number;
  directorsCount: number;
  teachersCount: number;
  classesCount: number;
  roomsCount: number;
  turmasCount: number;
  locationDescription: string;
  studentsWithDocs: number;
  studentsWithoutDocs: number;
  performanceRate: number;
  attendanceRate: number;
  schools: AdminSchool[];
}

export const QUESSUA_ZONES_LIST = [
  'Alto-Guiné',
  'Caezo',
  'Cassembele',
  'Carreira de Tiro',
  'Quêssua',
  'Quizanga',
  'Vila Matilde',
] as const;

export type QuessuaZone = (typeof QUESSUA_ZONES_LIST)[number];

// Alias for backwards compatibility
export const MUNICIPALITIES_LIST = QUESSUA_ZONES_LIST;

export const getZoneFromSchoolLocation = (location: string): string => {
  const loc = (location || '').toLowerCase();
  if (loc.includes('alto-guiné') || loc.includes('alto guiné') || loc.includes('guiné')) return 'Alto-Guiné';
  if (loc.includes('caezo')) return 'Caezo';
  if (loc.includes('cassembele')) return 'Cassembele';
  if (loc.includes('carreira de tiro') || loc.includes('tiro')) return 'Carreira de Tiro';
  if (loc.includes('quizanga')) return 'Quizanga';
  if (loc.includes('vila matilde') || loc.includes('matilde')) return 'Vila Matilde';
  if (loc.includes('quêssua') || loc.includes('quessua')) return 'Quêssua';
  return 'Quêssua'; // default central zone
};

export const getMunicipalityFromSchoolLocation = getZoneFromSchoolLocation;

export const computeMunicipalitySummaries = (schools: AdminSchool[]): Record<string, MunicipalitySummary> => {
  const summaries: Record<string, MunicipalitySummary> = {};

  QUESSUA_ZONES_LIST.forEach((zone) => {
    summaries[zone] = {
      id: zone.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: zone,
      schoolsCount: 0,
      directorsCount: 0,
      teachersCount: 0,
      classesCount: 0,
      roomsCount: 0,
      turmasCount: 0,
      locationDescription: `Zona de ${zone}, Município do Quêssua`,
      studentsWithDocs: 0,
      studentsWithoutDocs: 0,
      performanceRate: 0,
      attendanceRate: 0,
      schools: [],
    };
  });

  schools.forEach((school) => {
    const zone = getZoneFromSchoolLocation(school.location);
    if (!summaries[zone]) {
      summaries[zone] = {
        id: zone.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: zone,
        schoolsCount: 0,
        directorsCount: 0,
        teachersCount: 0,
        classesCount: 0,
        roomsCount: 0,
        turmasCount: 0,
        locationDescription: `Zona de ${zone}, Município do Quêssua`,
        studentsWithDocs: 0,
        studentsWithoutDocs: 0,
        performanceRate: 0,
        attendanceRate: 0,
        schools: [],
      };
    }

    const s = summaries[zone];
    s.schools.push(school);
    s.schoolsCount += 1;
    s.directorsCount += school.directorName ? 1 : 0;
    s.teachersCount += school.teachersCount || 0;
    s.classesCount += school.classesCount || 0;
    s.roomsCount += school.roomsCount || 0;
    s.turmasCount += school.turmasCount || 0;
    s.studentsWithDocs += school.studentsWithDocs || 0;
    s.studentsWithoutDocs += school.studentsWithoutDocs || 0;
  });

  // Calculate averages per zone
  Object.values(summaries).forEach((s) => {
    if (s.schools.length > 0) {
      const totalPerf = s.schools.reduce((acc, sc) => acc + (sc.performanceRate || 0), 0);
      const totalAtt = s.schools.reduce((acc, sc) => acc + (sc.attendanceRate || 0), 0);
      s.performanceRate = Math.round(totalPerf / s.schools.length);
      s.attendanceRate = Math.round((totalAtt / s.schools.length) * 10) / 10;
    } else {
      s.performanceRate = 82;
      s.attendanceRate = 96.0;
    }
  });

  return summaries;
};
