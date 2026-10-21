export type CityId = 'karur' | 'trichy' | 'dindigul';

export interface CityConfig {
  id: CityId;
  name: string;
  region: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  emergencyNumber: string;
  helplineName: string;
  helplineNumber: string;
  defaultOrigin: { name: string; coordinates: [number, number] };
  defaultDestination: { name: string; coordinates: [number, number] };
}

export const CITIES: Record<CityId, CityConfig> = {
  karur: {
    id: 'karur',
    name: 'Karur',
    region: 'Tamil Nadu, India',
    center: [78.0833, 10.9577],
    zoom: 14,
    emergencyNumber: '112',
    helplineName: 'Tamil Nadu Women Helpline (181 / 1091)',
    helplineNumber: '181',
    defaultOrigin: {
      name: 'Karur Central Bus Stand / Kovai Road',
      coordinates: [78.0772, 10.9602],
    },
    defaultDestination: {
      name: 'Karur Railway Junction / Jawahar Bazaar',
      coordinates: [78.0864, 10.9561],
    },
  },
  trichy: {
    id: 'trichy',
    name: 'Trichy (Tiruchirappalli)',
    region: 'Tamil Nadu, India',
    center: [78.6922, 10.8050],
    zoom: 13,
    emergencyNumber: '112',
    helplineName: 'Trichy City Police Women Help Desk',
    helplineNumber: '0431-2415100',
    defaultOrigin: {
      name: 'Trichy Central Bus Stand (Cantonment)',
      coordinates: [78.6854, 10.7932],
    },
    defaultDestination: {
      name: 'Chathiram Bus Stand / Main Guard Gate',
      coordinates: [78.6948, 10.8286],
    },
  },
  dindigul: {
    id: 'dindigul',
    name: 'Dindigul',
    region: 'Tamil Nadu, India',
    center: [77.9803, 10.3673],
    zoom: 14,
    emergencyNumber: '112',
    helplineName: 'Dindigul All Women Helpline (1091)',
    helplineNumber: '1091',
    defaultOrigin: {
      name: 'Dindigul Central Bus Stand',
      coordinates: [77.9734, 10.3638],
    },
    defaultDestination: {
      name: 'Dindigul Railway Junction / Main Bazaar',
      coordinates: [77.9845, 10.3615],
    },
  },
};

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator';
  createdAt: string;
  updatedAt?: string;
}

export interface TrustedContact {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  consentStatus: 'verified' | 'pending';
  notifyOnCheckinMissed: boolean;
  notifyOnSos: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type FacilityType = 'police' | 'pharmacy_247' | 'transit_hub' | 'safe_haven';

export interface SafetyFacility {
  _id: string;
  name: string;
  facilityType: FacilityType;
  city: CityId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  address: string;
  phone?: string;
  operatingHours: string;
  sourceName: string;
  sourceUrl?: string;
  verificationStatus: 'verified' | 'unverified';
  verifiedAt: string;
  createdAt: string;
}

export type TripStatus = 'PLANNED' | 'ACTIVE' | 'CHECKIN_DUE' | 'ALERT_PENDING' | 'ALERT_SIMULATED' | 'COMPLETED' | 'CANCELLED';

export interface TripLocation {
  name: string;
  coordinates: [number, number];
}

export interface Trip {
  _id: string;
  userId: string;
  city: CityId;
  origin: TripLocation;
  destination: TripLocation;
  routeGeometry?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  distanceMeters: number;
  durationSeconds: number;
  status: TripStatus;
  checkinIntervalMinutes: number;
  routeReadinessScore: number;
  factorBreakdown?: FactorBreakdown;
  startedAt?: string;
  endedAt?: string;
  nextCheckinDueAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripCheckin {
  _id: string;
  tripId: string;
  userId: string;
  checkpointNumber: number;
  dueAt: string;
  checkedInAt?: string;
  status: 'PENDING' | 'ON_TIME' | 'LATE' | 'MISSED';
  createdAt: string;
}

export type IncidentCategory = 'LIGHTING' | 'SUSPICIOUS' | 'HAZARD' | 'HARASSMENT' | 'INFRASTRUCTURE';
export type ReviewStatus = 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface IncidentReport {
  _id: string;
  reporterId: string;
  category: IncidentCategory;
  city: CityId;
  location: {
    type: 'Point';
    coordinates: [number, number];
    approximateAddress: string;
  };
  description: string;
  occurredAt: string;
  reviewStatus: ReviewStatus;
  sourceType: 'COMMUNITY' | 'OFFICIAL_FEED';
  moderationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SafetyEventType =
  | 'TRIP_STARTED'
  | 'CHECKIN_LOGGED'
  | 'CHECKIN_WARNING'
  | 'CHECKIN_OVERDUE'
  | 'SOS_TRIGGERED'
  | 'ALERT_CANCELLED'
  | 'ALERT_RESOLVED'
  | 'TRIP_COMPLETED';

export type EventSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SafetyEvent {
  _id: string;
  tripId: string;
  userId: string;
  eventType: SafetyEventType;
  severity: EventSeverity;
  simulationMode: true;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface FactorBreakdown {
  facilitiesScore: number; // 0-100 (weight 0.30)
  transitScore: number;    // 0-100 (weight 0.25)
  lightingScore: number;   // 0-100 (weight 0.25)
  dataFreshnessScore: number; // 0-100 (weight 0.20)
  facilityCountNearby: number;
  transitStopsNearby: number;
  lightingDataAvailable: boolean;
  freshReportsCount: number;
}

export interface RouteAssessment {
  score: number; // 0-100
  confidence: number; // 0-100
  factors: FactorBreakdown;
  missingFactors: string[];
  explanation: string;
  dataSources: string[];
  calculatedAt: string;
}

export interface JourneyAdviceResponse {
  routeSummary: string;
  keySafetyHighlights: string[];
  preparationChecklist: string[];
  recommendedCheckpoints: string[];
  disclaimer: string;
}
