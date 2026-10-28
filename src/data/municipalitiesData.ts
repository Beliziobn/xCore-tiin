export interface QuessuaSectorData {
  id: string;
  name: string;
  shortName: string;
  region: string;
  schoolsCount: number;
  studentsCount: number;
  teachersCount: number;
  directorsCount: number;
  classroomsCount: number;
  performanceRate: number;
  attendanceRate: number;
  approvalRate: number;
  featuredSchools: string[];
  coordinates: string;
  path: string;
  labelX: number;
  labelY: number;
}

export const QUESSUA_SECTORS_DATA: QuessuaSectorData[] = [
  {
    id: 'quessua-sede',
    name: 'Quêssua Sede (Vila Central)',
    shortName: 'Quêssua Sede',
    region: 'Zona Urbana & Administrativa',
    schoolsCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    directorsCount: 0,
    classroomsCount: 0,
    performanceRate: 0,
    attendanceRate: 0,
    approvalRate: 0,
    featuredSchools: [],
    coordinates: '9.6442° S, 16.3210° E',
    path: 'M 210,165 L 285,155 L 305,215 L 265,255 L 200,235 Z',
    labelX: 252,
    labelY: 205,
  },
  {
    id: 'missao-quessua',
    name: 'Missão do Quêssua (Polo Histórico)',
    shortName: 'Missão Quêssua',
    region: 'Polo Histórico & Pedagógico',
    schoolsCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    directorsCount: 0,
    classroomsCount: 0,
    performanceRate: 0,
    attendanceRate: 0,
    approvalRate: 0,
    featuredSchools: [],
    coordinates: '9.6310° S, 16.3420° E',
    path: 'M 285,155 L 395,120 L 420,205 L 305,215 Z',
    labelX: 355,
    labelY: 175,
  },
  {
    id: 'kambaxe',
    name: 'Sector Escolar de Kambaxe',
    shortName: 'Kambaxe',
    region: 'Zona Norte de Quêssua',
    schoolsCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    directorsCount: 0,
    classroomsCount: 0,
    performanceRate: 0,
    attendanceRate: 0,
    approvalRate: 0,
    featuredSchools: [],
    coordinates: '9.5980° S, 16.3050° E',
    path: 'M 175,75 L 315,65 L 395,120 L 285,155 L 210,165 Z',
    labelX: 275,
    labelY: 115,
  },
  {
    id: 'lombe-quessua',
    name: 'Sector Escolar do Lombe-Quêssua',
    shortName: 'Lombe-Quêssua',
    region: 'Eixo Leste / Agrícola',
    schoolsCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    directorsCount: 0,
    classroomsCount: 0,
    performanceRate: 0,
    attendanceRate: 0,
    approvalRate: 0,
    featuredSchools: [],
    coordinates: '9.6550° S, 16.3890° E',
    path: 'M 305,215 L 420,205 L 460,295 L 345,320 L 265,255 Z',
    labelX: 365,
    labelY: 262,
  },
  {
    id: 'ngola-luije',
    name: 'Comuna de Ngola Luije (Norte)',
    shortName: 'Ngola Luije',
    region: 'Zona Noroeste',
    schoolsCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    directorsCount: 0,
    classroomsCount: 0,
    performanceRate: 0,
    attendanceRate: 0,
    approvalRate: 0,
    featuredSchools: [],
    coordinates: '9.5850° S, 16.2450° E',
    path: 'M 75,110 L 175,75 L 210,165 L 200,235 L 95,220 Z',
    labelX: 148,
    labelY: 162,
  },
  {
    id: 'quizenga-sul',
    name: 'Sector Sul / Vale do Quêssua',
    shortName: 'Vale do Quêssua',
    region: 'Zona Sul Agropecuária',
    schoolsCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    directorsCount: 0,
    classroomsCount: 0,
    performanceRate: 0,
    attendanceRate: 0,
    approvalRate: 0,
    featuredSchools: [],
    coordinates: '9.6920° S, 16.3120° E',
    path: 'M 95,220 L 200,235 L 265,255 L 345,320 L 240,380 L 115,335 Z',
    labelX: 215,
    labelY: 310,
  },
  {
    id: 'cangandala-fronteira',
    name: 'Sector Limítrofe Sul-Oeste',
    shortName: 'Eixo Sul-Oeste',
    region: 'Zona Rural Expansão',
    schoolsCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    directorsCount: 0,
    classroomsCount: 0,
    performanceRate: 0,
    attendanceRate: 0,
    approvalRate: 0,
    featuredSchools: [],
    coordinates: '9.7340° S, 16.2680° E',
    path: 'M 115,335 L 240,380 L 345,320 L 390,425 L 185,445 L 90,395 Z',
    labelX: 235,
    labelY: 400,
  },
];

export const LUANDA_MUNICIPALITIES_DATA = QUESSUA_SECTORS_DATA;
export type LuandaMunicipalityData = QuessuaSectorData;

export const QUESSUA_PROVINCE_SUMMARY = {
  totalMunicipalities: 7,
  totalSchools: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalDirectors: 0,
  averageApprovalRate: 0,
  averageAttendanceRate: 0,
};

export const LUANDA_PROVINCE_SUMMARY = QUESSUA_PROVINCE_SUMMARY;

export const QUESSUA_ZONES_LIST = [
  'Quêssua',
  'Alto-Guiné',
  'Carreira de Tiro',
  'Cassembele',
  'Caezo',
  'Quizanga',
  'Vila Matilde',
];

export const LUANDA_MUNICIPALITIES_LIST = QUESSUA_ZONES_LIST;

export interface MunicipalitySummary {
  name: string;
  schoolsCount: number;
  directorsCount: number;
  teachersCount: number;
  classesCount: number;
  roomsCount: number;
  turmasCount: number;
  studentsWithDocs: number;
  studentsWithoutDocs: number;
  performanceRate: number;
  attendanceRate: number;
}

export function getZoneFromSchoolLocation(location: string = ''): string {
  const loc = location.toLowerCase();
  for (const zone of QUESSUA_ZONES_LIST) {
    if (loc.includes(zone.toLowerCase())) {
      return zone;
    }
  }
  return 'Quêssua';
}

export function computeMunicipalitySummaries(schools: Array<{
  location?: string;
  directorName?: string;
  teachersCount?: number;
  classesCount?: number;
  roomsCount?: number;
  turmasCount?: number;
  studentsWithDocs?: number;
  studentsWithoutDocs?: number;
  performanceRate?: number;
  attendanceRate?: number;
}> = []): Record<string, MunicipalitySummary> {
  const summaries: Record<string, MunicipalitySummary> = {};
  for (const zone of QUESSUA_ZONES_LIST) {
    const zoneSchools = schools.filter((s) => getZoneFromSchoolLocation(s.location || '') === zone);
    const count = zoneSchools.length;
    summaries[zone] = {
      name: zone,
      schoolsCount: count,
      directorsCount: zoneSchools.filter((s) => !!s.directorName).length,
      teachersCount: zoneSchools.reduce((acc, s) => acc + (s.teachersCount || 0), 0),
      classesCount: zoneSchools.reduce((acc, s) => acc + (s.classesCount || 0), 0),
      roomsCount: zoneSchools.reduce((acc, s) => acc + (s.roomsCount || 0), 0),
      turmasCount: zoneSchools.reduce((acc, s) => acc + (s.turmasCount || 0), 0),
      studentsWithDocs: zoneSchools.reduce((acc, s) => acc + (s.studentsWithDocs || 0), 0),
      studentsWithoutDocs: zoneSchools.reduce((acc, s) => acc + (s.studentsWithoutDocs || 0), 0),
      performanceRate: count > 0 ? Math.round(zoneSchools.reduce((acc, s) => acc + (s.performanceRate || 0), 0) / count) : 0,
      attendanceRate: count > 0 ? Number((zoneSchools.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / count).toFixed(1)) : 0,
    };
  }
  return summaries;
}

