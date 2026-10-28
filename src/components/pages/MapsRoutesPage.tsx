import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Route,
  Compass,
  Building2,
  Phone,
  Clock,
  Car,
  Bus,
  Footprints,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Share2,
  Maximize2,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export interface SchoolLocation {
  id: string;
  name: string;
  code: string;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  level: string;
  studentCount: number;
  teacherCount: number;
  contactPhone: string;
  contactEmail: string;
  directorName: string;
  courses: string[];
  imageUrl?: string;
  status: 'active' | 'certified' | 'pilot';
}

export const ANGOLA_SCHOOLS: SchoolLocation[] = [];


export interface OriginPreset {
  id: string;
  name: string;
  coords: { lat: number; lng: number };
  description: string;
}

export const ORIGIN_PRESETS: OriginPreset[] = [
  {
    id: 'aeroporto-luanda',
    name: 'Aeroporto Internacional 4 de Fevereiro (Luanda)',
    coords: { lat: -8.8583, lng: 13.2312 },
    description: 'Avenida Deolinda Rodrigues, Luanda'
  },
  {
    id: 'centro-malanje',
    name: 'Centro da Cidade de Malanje (Largo da Liberdade)',
    coords: { lat: -9.5432, lng: 16.3456 },
    description: 'Praça Central de Malanje'
  },
  {
    id: 'largo-1-maio-luanda',
    name: 'Largo 1º de Maio / Estação do Caminho de Ferro (Luanda)',
    coords: { lat: -8.8252, lng: 13.2425 },
    description: 'Terminal Rodoviário e Ferroviário de Luanda'
  },
  {
    id: 'terminal-benguela',
    name: 'Terminal Central de Passageiros (Benguela)',
    coords: { lat: -12.5801, lng: 13.4112 },
    description: 'Estrada de Catumbela, Benguela'
  }
];

export interface RouteCalculationResult {
  distanceKm: number;
  durationMinutes: number;
  durationFormatted: string;
  steps: {
    instruction: string;
    distance: string;
    road: string;
  }[];
  fuelEstimateLiters: number;
  googleMapsUrl: string;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Multiply by road winding factor in Angola topography (~1.28x)
  return Math.round(R * c * 1.28 * 10) / 10;
}

interface MapsRoutesPageProps {
  onNavigateHome: () => void;
  onNavigateFAQ?: () => void;
  onNavigateCases?: () => void;
  onNavigateMeetings?: () => void;
  onOpenDemoRequest?: () => void;
}

export const MapsRoutesPage: React.FC<MapsRoutesPageProps> = ({
  onNavigateHome,
  onNavigateFAQ,
  onNavigateCases,
  onNavigateMeetings,
  onOpenDemoRequest
}) => {
  const [selectedSchool, setSelectedSchool] = useState<SchoolLocation>(ANGOLA_SCHOOLS[0]);
  const [selectedOriginId, setSelectedOriginId] = useState<string>('centro-malanje');
  const [travelMode, setTravelMode] = useState<'driving' | 'transit' | 'walking'>('driving');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');
  const [searchSchoolQuery, setSearchSchoolQuery] = useState('');
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [customOriginCoords, setCustomOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [customOriginLabel, setCustomOriginLabel] = useState<string | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // API Key from environment or empty
  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // Filtered schools
  const filteredSchools = useMemo(() => {
    return ANGOLA_SCHOOLS.filter((school) => {
      const matchProv = selectedProvinceFilter === 'all' || school.province.toLowerCase() === selectedProvinceFilter.toLowerCase();
      const matchSearch =
        !searchSchoolQuery ||
        school.name.toLowerCase().includes(searchSchoolQuery.toLowerCase()) ||
        school.province.toLowerCase().includes(searchSchoolQuery.toLowerCase()) ||
        school.municipality.toLowerCase().includes(searchSchoolQuery.toLowerCase()) ||
        school.code.toLowerCase().includes(searchSchoolQuery.toLowerCase());
      return matchProv && matchSearch;
    });
  }, [selectedProvinceFilter, searchSchoolQuery]);

  // Current Origin Coordinates
  const currentOrigin = useMemo(() => {
    if (customOriginCoords && customOriginLabel) {
      return {
        name: customOriginLabel,
        coords: customOriginCoords,
        description: 'Coordenadas obtidas via GPS do dispositivo'
      };
    }
    const preset = ORIGIN_PRESETS.find((p) => p.id === selectedOriginId) || ORIGIN_PRESETS[0];
    return preset;
  }, [selectedOriginId, customOriginCoords, customOriginLabel]);

  // Route calculation
  const calculatedRoute = useMemo<RouteCalculationResult>(() => {
    const originCoords = currentOrigin.coords;
    const destCoords = selectedSchool.coordinates;

    const km = calculateDistanceKm(
      originCoords.lat,
      originCoords.lng,
      destCoords.lat,
      destCoords.lng
    );

    let speedKmh = 70; // driving average
    if (travelMode === 'transit') speedKmh = 48; // bus with stops
    if (travelMode === 'walking') speedKmh = 4.8; // walking

    const totalHours = km / speedKmh;
    const totalMinutes = Math.round(totalHours * 60);

    let durationFormatted = '';
    if (totalMinutes < 60) {
      durationFormatted = `${totalMinutes} min`;
    } else {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      durationFormatted = m > 0 ? `${h}h ${m}m` : `${h}h`;
    }

    // Generate tailored itineraries based on origin & destination provinces
    const steps = [];
    const isSameProvince = selectedSchool.province.toLowerCase() === currentOrigin.name.toLowerCase();

    if (km < 25) {
      steps.push({
        instruction: `Partir de ${currentOrigin.name} em direção ao centro urbano`,
        distance: `${Math.round(km * 0.25 * 10) / 10} km`,
        road: 'Avenida Principal / Via Urbana'
      });
      steps.push({
        instruction: `Seguir as indicações para ${selectedSchool.neighborhood}`,
        distance: `${Math.round(km * 0.55 * 10) / 10} km`,
        road: 'Via de Ligação Municipal'
      });
      steps.push({
        instruction: `Entrar no arruamento da escola até ao portão principal (${selectedSchool.name})`,
        distance: `${Math.round(km * 0.2 * 10) / 10} km`,
        road: selectedSchool.address
      });
    } else {
      steps.push({
        instruction: `Partida de ${currentOrigin.name} em direção à saída interprovincial`,
        distance: '8.5 km',
        road: 'Via Rápida de Acesso'
      });
      steps.push({
        instruction: `Seguir pela Estrada Nacional (EN-230 / EN-100) em direção a ${selectedSchool.province}`,
        distance: `${Math.max(10, Math.round((km - 20) * 10) / 10)} km`,
        road: 'Corredor Rodoviário Nacional'
      });
      steps.push({
        instruction: `Aproximação ao município de ${selectedSchool.municipality} e viragem para ${selectedSchool.neighborhood}`,
        distance: '9.2 km',
        road: 'Desvio para o Polo Escolar'
      });
      steps.push({
        instruction: `Chegada ao destino no portão principal do ${selectedSchool.name}`,
        distance: '2.3 km',
        road: selectedSchool.address
      });
    }

    // Fuel estimate (approx 9L per 100km for sedan / 22L for school minibus)
    const fuelLiters = travelMode === 'walking' ? 0 : Math.round((km * (travelMode === 'transit' ? 0.22 : 0.09)) * 10) / 10;

    // Direct Google Maps Directions link
    const modeParam = travelMode === 'transit' ? 'transit' : travelMode === 'walking' ? 'walking' : 'driving';
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&travelmode=${modeParam}`;

    return {
      distanceKm: km,
      durationMinutes: totalMinutes,
      durationFormatted,
      steps,
      fuelEstimateLiters: fuelLiters,
      googleMapsUrl
    };
  }, [currentOrigin, selectedSchool, travelMode]);

  // Request browser geolocation for GPS origin
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada no seu navegador.');
      return;
    }
    setIsLocatingUser(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingUser(false);
        const { latitude, longitude } = position.coords;
        setCustomOriginCoords({ lat: latitude, lng: longitude });
        setCustomOriginLabel('A Minha Localização GPS Atual');
      },
      (error) => {
        setIsLocatingUser(false);
        setLocationError('Não foi possível obter o sinal de GPS. A usar os pontos de partida de referência.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectPresetOrigin = (originId: string) => {
    setSelectedOriginId(originId);
    setCustomOriginCoords(null);
    setCustomOriginLabel(null);
    setLocationError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-6 sm:pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#f75142] transition-colors cursor-pointer mb-2"
            >
              <span>&larr; Voltar à Página Inicial</span>
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-[#f75142] text-[11px] font-bold uppercase tracking-wider">
                <MapPin className="w-3 h-3" />
                Rede Escolar Nacional
              </span>
              <span className="text-xs text-slate-500">
                Cobertura oficial de instituições parceiras em Angola
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#002133] tracking-tight mt-1">
              Mapa de Instituições de Ensino & Calculador de Rotas
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{ANGOLA_SCHOOLS.length} Polos Mapeados</span>
            </span>
            {onOpenDemoRequest && (
              <button
                onClick={onOpenDemoRequest}
                className="px-3.5 py-1.5 rounded-lg bg-[#002133] text-white text-xs font-bold hover:bg-[#00314d] transition-colors cursor-pointer"
              >
                Cadastrar Escola
              </button>
            )}
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: School Selector & Route Planner (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Box 1: Route Planner (Planeador de Deslocações) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-[#f75142] flex items-center justify-center">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Planeador de Rota Pedagógica</h2>
                    <p className="text-[11px] text-slate-500">Calcule tempo, distância e itinerário até à escola</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTravelMode('driving')}
                    title="Viatura particular / Carro"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      travelMode === 'driving' ? 'bg-white text-[#f75142] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTravelMode('transit')}
                    title="Transporte escolar / Autocarro"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      travelMode === 'transit' ? 'bg-white text-[#f75142] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Bus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTravelMode('walking')}
                    title="A Pé"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      travelMode === 'walking' ? 'bg-white text-[#f75142] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Footprints className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Point A: Origin */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-black">
                      A
                    </span>
                    <span>Ponto de Partida (Origem):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isLocatingUser}
                    className="text-[11px] font-bold text-[#f75142] hover:text-[#d4382a] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Compass className="w-3 h-3" />
                    <span>{isLocatingUser ? 'A detetar...' : 'Usar GPS Atual'}</span>
                  </button>
                </div>

                {customOriginLabel ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/70 border border-red-200 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#f75142]" />
                      {customOriginLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetOrigin('centro-malanje')}
                      className="text-[11px] text-[#f75142] font-bold hover:underline"
                    >
                      Alterar
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedOriginId}
                    onChange={(e) => handleSelectPresetOrigin(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]/30"
                  >
                    {ORIGIN_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                )}
                {locationError && (
                  <p className="text-[11px] text-amber-600 font-medium">{locationError}</p>
                )}
              </div>

              {/* Point B: Destination (Selected School) */}
              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f75142] text-white text-[10px] flex items-center justify-center font-black">
                    B
                  </span>
                  <span>Escola de Destino:</span>
                </label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{selectedSchool.name}</div>
                    <div className="text-[11px] text-slate-500">{selectedSchool.address}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold">
                      <span className="px-1.5 py-0.2 rounded bg-slate-200">{selectedSchool.province}</span>
                      <span>Código: {selectedSchool.code}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Summary Metrics Badge */}
              <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-3 mb-4">
                <div className="text-center border-r border-slate-700/60 pr-1">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Distância</div>
                  <div className="text-base sm:text-lg font-black text-white">{calculatedRoute.distanceKm} km</div>
                </div>
                <div className="text-center border-r border-slate-700/60 px-1">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Tempo Estimado</div>
                  <div className="text-base sm:text-lg font-black text-[#f75142]">
                    {calculatedRoute.durationFormatted}
                  </div>
                </div>
                <div className="text-center pl-1">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    {travelMode === 'walking' ? 'Passos Aprox.' : 'Combustível'}
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-400">
                    {travelMode === 'walking'
                      ? `${Math.round(calculatedRoute.distanceKm * 1320).toLocaleString()} p`
                      : `${calculatedRoute.fuelEstimateLiters} L`}
                  </div>
                </div>
              </div>

              {/* Step by Step Itinerary */}
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-[#f75142]" />
                  <span>Itinerário Recomendado de Acesso</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs text-slate-600 divide-y divide-slate-100">
                  {calculatedRoute.steps.map((step, sIdx) => (
                    <div key={sIdx} className="pt-2 pb-1 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0 flex items-center justify-center mt-0.5">
                        {sIdx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{step.instruction}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Via: {step.road}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{step.distance}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct GPS Google Maps Button */}
              <a
                href={calculatedRoute.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#f75142] hover:bg-[#d4382a] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span>Navegar no Google Maps GPS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Box 2: Institutional Directory Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#f75142]" />
                  <span>Polos e Escolas Cadastradas ({filteredSchools.length})</span>
                </h3>

                {/* Province Filter */}
                <select
                  value={selectedProvinceFilter}
                  onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                  className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="all">Todas Províncias</option>
                  <option value="malanje">Malanje</option>
                  <option value="luanda">Luanda</option>
                  <option value="benguela">Benguela</option>
                </select>
              </div>

              {/* Search School */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchSchoolQuery}
                  onChange={(e) => setSearchSchoolQuery(e.target.value)}
                  placeholder="Filtrar por escola, código ou bairro..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#f75142]"
                />
              </div>

              {/* List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredSchools.map((school) => {
                  const isSelected = selectedSchool.id === school.id;
                  return (
                    <div
                      key={school.id}
                      onClick={() => {
                        setSelectedSchool(school);
                        setInfoWindowOpen(true);
                      }}
                      className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'border-[#f75142] bg-red-50/50 ring-1 ring-[#f75142]/20'
                          : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{school.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {school.municipality}, {school.province}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded font-semibold text-slate-600">
                            {school.code}
                          </span>
                          <span>•</span>
                          <span>{school.level}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          {school.studentCount > 0 ? `${school.studentCount} Alunos` : 'Sede'}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#f75142] mt-2 flex items-center gap-0.5">
                            Destino Ativo &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Map Display (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Map Controls Top Bar */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#f75142] flex items-center justify-center text-white">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold leading-tight">Visualização Geográfica Escolar</h2>
                    <p className="text-[11px] text-slate-300">
                      Províncias de Malanje, Luanda e Benguela • Coordenadas Oficiais
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSchool(ANGOLA_SCHOOLS[0]);
                      setInfoWindowOpen(true);
                    }}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold transition-colors cursor-pointer text-slate-200"
                  >
                    Focar Malanje
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSchool(ANGOLA_SCHOOLS[3]);
                      setInfoWindowOpen(true);
                    }}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold transition-colors cursor-pointer text-slate-200"
                  >
                    Focar Luanda
                  </button>
                </div>
              </div>

              {/* Map Viewport */}
              <div className="relative w-full h-[520px] bg-slate-100 overflow-hidden">
                {mapsApiKey ? (
                  // Real Google Maps Platform integration using @vis.gl/react-google-maps
                  <APIProvider apiKey={mapsApiKey} libraries={['routes', 'places']}>
                    <Map
                      mapId="DEMO_MAP_ID"
                      className="w-full h-full"
                      defaultCenter={selectedSchool.coordinates}
                      center={selectedSchool.coordinates}
                      defaultZoom={selectedSchool.province === 'Malanje' ? 12 : 11}
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    >
                      {/* Origin Marker */}
                      <AdvancedMarker
                        position={currentOrigin.coords}
                        title={`Origem: ${currentOrigin.name}`}
                      >
                        <Pin background="#002133" borderColor="#ffffff" glyphColor="#ffffff" />
                      </AdvancedMarker>

                      {/* Schools Markers */}
                      {filteredSchools.map((school) => {
                        const isSelected = selectedSchool.id === school.id;
                        return (
                          <AdvancedMarker
                            key={school.id}
                            position={school.coordinates}
                            title={school.name}
                            onClick={() => {
                              setSelectedSchool(school);
                              setInfoWindowOpen(true);
                            }}
                          >
                            <Pin
                              background={isSelected ? '#f75142' : '#0284c7'}
                              borderColor="#ffffff"
                              glyphColor="#ffffff"
                              scale={isSelected ? 1.2 : 1.0}
                            />
                          </AdvancedMarker>
                        );
                      })}

                      {infoWindowOpen && (
                        <InfoWindow
                          position={selectedSchool.coordinates}
                          onCloseClick={() => setInfoWindowOpen(false)}
                        >
                          <div className="p-2 max-w-xs text-slate-800">
                            <h4 className="font-bold text-xs text-slate-900">{selectedSchool.name}</h4>
                            <p className="text-[11px] text-slate-600">{selectedSchool.address}</p>
                            <div className="mt-1 text-[10px] text-slate-500 font-medium">
                              Director: {selectedSchool.directorName} • Tel: {selectedSchool.contactPhone}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-700">
                                {selectedSchool.studentCount} alunos
                              </span>
                              <a
                                href={calculatedRoute.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-[#f75142] underline"
                              >
                                Como Chegar &rarr;
                              </a>
                            </div>
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </APIProvider>
                ) : (
                  // Rich Interactive Stylized SVG Cartography & Simulation for Angola Schools
                  <div className="w-full h-full relative bg-gradient-to-br from-slate-900 via-[#0a1926] to-[#011420] p-6 text-white select-none">
                    {/* Background grid lines */}
                    <div
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{
                        backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                      }}
                    ></div>

                    {/* Notice bar about API key / Demo key */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-xs shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="font-semibold text-slate-200">
                          Cartografia Digital Sigre Angola • Modo Demonstrativo Ativo
                        </span>
                      </div>
                      <a
                        href={calculatedRoute.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f75142] text-white font-bold text-[11px] hover:bg-[#d4382a] transition-all shadow-xs"
                      >
                        <span>Abrir no Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Stylized Canvas Layout */}
                    <div className="w-full h-full flex flex-col justify-between pt-16 pb-4">
                      {/* Active Connection Info card */}
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 max-w-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                            Vetor de Trajeto Selecionado
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            {calculatedRoute.distanceKm} km
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="text-[11px] text-slate-400">Origem:</div>
                            <div className="text-xs font-bold text-white truncate">{currentOrigin.name}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#f75142] shrink-0" />
                          <div className="flex-1">
                            <div className="text-[11px] text-slate-400">Destino:</div>
                            <div className="text-xs font-bold text-white truncate">{selectedSchool.name}</div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                          <span>Tempo Estimado: <strong className="text-white">{calculatedRoute.durationFormatted}</strong></span>
                          <span>Modo: <strong className="text-white uppercase">{travelMode}</strong></span>
                        </div>
                      </div>

                      {/* Interactive Visual Map of Angola Centers */}
                      <div className="relative w-full h-48 bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-around">
                        {/* Luanda Hub */}
                        <button
                          type="button"
                          onClick={() => setSelectedSchool(ANGOLA_SCHOOLS[3])}
                          className={`flex flex-col items-center group cursor-pointer transition-all ${
                            selectedSchool.province === 'Luanda' ? 'scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                            selectedSchool.province === 'Luanda'
                              ? 'bg-[#f75142] ring-4 ring-[#f75142]/30 text-white'
                              : 'bg-slate-700 text-slate-200'
                          }`}>
                            LUA
                          </div>
                          <span className="text-xs font-bold text-white mt-1.5">Polo Luanda</span>
                          <span className="text-[10px] text-slate-400">2 Escolas Cadastradas</span>
                        </button>

                        {/* Connector line */}
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-red-500/60 via-amber-400/40 to-emerald-500/60 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-white/10">
                            Estrada Nacional EN-230
                          </div>
                        </div>

                        {/* Malanje Hub */}
                        <button
                          type="button"
                          onClick={() => setSelectedSchool(ANGOLA_SCHOOLS[0])}
                          className={`flex flex-col items-center group cursor-pointer transition-all ${
                            selectedSchool.province === 'Malanje' ? 'scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                            selectedSchool.province === 'Malanje'
                              ? 'bg-[#f75142] ring-4 ring-[#f75142]/30 text-white'
                              : 'bg-slate-700 text-slate-200'
                          }`}>
                            MAL
                          </div>
                          <span className="text-xs font-bold text-white mt-1.5">Polo Malanje</span>
                          <span className="text-[10px] text-slate-400">3 Escolas (Quêssua/Eiffel)</span>
                        </button>

                        {/* Connector line */}
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-500/60 to-blue-500/60 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-white/10">
                            EN-100 Litoral
                          </div>
                        </div>

                        {/* Benguela Hub */}
                        <button
                          type="button"
                          onClick={() => setSelectedSchool(ANGOLA_SCHOOLS[5])}
                          className={`flex flex-col items-center group cursor-pointer transition-all ${
                            selectedSchool.province === 'Benguela' ? 'scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                            selectedSchool.province === 'Benguela'
                              ? 'bg-[#f75142] ring-4 ring-[#f75142]/30 text-white'
                              : 'bg-slate-700 text-slate-200'
                          }`}>
                            BGL
                          </div>
                          <span className="text-xs font-bold text-white mt-1.5">Polo Benguela</span>
                          <span className="text-[10px] text-slate-400">Instituto Politécnico</span>
                        </button>
                      </div>

                      {/* Bottom Info bar */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>Coordenadas do Destino: {selectedSchool.coordinates.lat.toFixed(4)}, {selectedSchool.coordinates.lng.toFixed(4)}</span>
                        <span>Código Oficial SIGE: {selectedSchool.code}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* School Details Drawer underneath Map */}
              <div className="p-5 border-t border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                        {selectedSchool.code}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Polo Homologado
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#002133] mt-1">{selectedSchool.name}</h3>
                    <p className="text-xs text-slate-500">{selectedSchool.address}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`tel:${selectedSchool.contactPhone.replace(/\s+/g, '')}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#f75142]" />
                      <span>{selectedSchool.contactPhone}</span>
                    </a>
                    <a
                      href={calculatedRoute.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#002133] hover:bg-[#00314d] text-white text-xs font-bold transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#f75142]" />
                      <span>Ver Rota GPS</span>
                    </a>
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Diretor Pedagógico:</span>
                    <span className="font-bold text-slate-800">{selectedSchool.directorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Corpo Docente:</span>
                    <span className="font-bold text-slate-800">{selectedSchool.teacherCount} Professores</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Alunos Matriculados:</span>
                    <span className="font-bold text-slate-800">{selectedSchool.studentCount.toLocaleString()} Alunos</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Nível de Ensino:</span>
                    <span className="font-bold text-slate-800">{selectedSchool.level}</span>
                  </div>
                </div>

                {/* Courses */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                    Cursos & Ramos Curriculares Oferecidos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSchool.courses.map((course, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Footer inside Map Page */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Info className="w-4 h-4 text-[#f75142]" />
                <span>Precisa de integrar a sua escola no mapa ou marcar visita técnica?</span>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateFAQ && (
                  <button
                    onClick={onNavigateFAQ}
                    className="font-bold text-slate-700 hover:text-[#f75142] underline cursor-pointer"
                  >
                    Consultar FAQ
                  </button>
                )}
                {onNavigateCases && (
                  <button
                    onClick={onNavigateCases}
                    className="font-bold text-slate-700 hover:text-[#f75142] underline cursor-pointer"
                  >
                    Ver Casos de Sucesso
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
