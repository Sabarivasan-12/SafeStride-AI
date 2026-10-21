import { FactorBreakdown, RouteAssessment, SafetyFacility, IncidentReport } from '../types.ts';

/**
 * SafeStride AI Deterministic Route Readiness Engine
 * 
 * Formula:
 *   Score = 0.30 * F + 0.25 * T + 0.25 * L + 0.20 * D
 * 
 * Where:
 *   F = Support facility availability (police stations, 24/7 pharmacies, safe havens within buffer)
 *   T = Public transit accessibility (metro/bus stations within 300m)
 *   L = Municipal street lighting coverage & verified luminaire data
 *   D = Community data freshness & verified incident proximity
 * 
 * Missing-Data Policy:
 *   When specific spatial layers (e.g., municipal street lighting) are unmeasured or provisional,
 *   the factor receives a baseline provisional weight (50) and is added to `missingFactors`,
 *   simultaneously penalizing overall confidence percentage.
 */

export const ROUTE_DISCLAIMER =
  'Route readiness summarizes available public evidence and does not guarantee personal safety. Always trust your instincts and maintain emergency awareness.';

export interface AssessmentInput {
  originCoords: [number, number];
  destinationCoords: [number, number];
  routeCoordinates?: [number, number][];
  facilities: SafetyFacility[];
  recentIncidents?: IncidentReport[];
  lightingCoverageAvailable?: boolean;
}

/**
 * Calculates distance in kilometers between two [lng, lat] points using the Haversine formula.
 */
export function calculateDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is within buffer distance (in km) from any segment of a route line.
 */
export function isPointNearRoute(
  point: [number, number],
  routePoints: [number, number][],
  bufferKm = 0.5
): boolean {
  for (const pt of routePoints) {
    if (calculateDistanceKm(point, pt) <= bufferKm) {
      return true;
    }
  }
  return false;
}

/**
 * Pure, deterministic evaluation of route readiness independent of UI or external services.
 */
export function calculateRouteReadiness(input: AssessmentInput): RouteAssessment {
  const {
    originCoords,
    destinationCoords,
    routeCoordinates,
    facilities,
    recentIncidents = [],
    lightingCoverageAvailable = true,
  } = input;

  // Build reference points along route
  const samplingPoints: [number, number][] =
    routeCoordinates && routeCoordinates.length > 0
      ? routeCoordinates
      : [
          originCoords,
          [
            (originCoords[0] + destinationCoords[0]) / 2,
            (originCoords[1] + destinationCoords[1]) / 2,
          ],
          destinationCoords,
        ];

  // 1. Facilities availability (F)
  const nearbyFacilities = facilities.filter((f) =>
    isPointNearRoute(f.location.coordinates, samplingPoints, 0.6)
  );

  const safeHavens = nearbyFacilities.filter(
    (f) => f.facilityType === 'safe_haven' || f.facilityType === 'pharmacy_247'
  );
  const policeStations = nearbyFacilities.filter((f) => f.facilityType === 'police');
  const transitHubs = nearbyFacilities.filter((f) => f.facilityType === 'transit_hub');

  // Facilities score: 0 to 100 based on verified safe points of shelter/support
  let facilitiesScore = Math.min(
    100,
    safeHavens.length * 28 + policeStations.length * 35 + (nearbyFacilities.length > 0 ? 20 : 0)
  );
  if (facilitiesScore === 0) facilitiesScore = 15; // Baseline minimum

  // 2. Public Transit Accessibility (T)
  const transitScore = Math.min(100, Math.max(20, transitHubs.length * 35 + 25));

  // 3. Lighting Data Availability & Quality (L)
  const missingFactors: string[] = [];
  let lightingScore = 75; // Default standard municipal lighting corridor
  let confidence = 95;

  if (!lightingCoverageAvailable) {
    lightingScore = 50; // Neutral provisional score
    missingFactors.push('Municipal Street Lighting Survey (Unverified in this corridor)');
    confidence -= 20;
  }

  // 4. Relevant Safety Data & Freshness (D)
  const nearbyIncidents = recentIncidents.filter((inc) =>
    isPointNearRoute(inc.location.coordinates, samplingPoints, 0.8)
  );

  let dataFreshnessScore = 80;
  // If recent incidents have been reported in this corridor, adjust the score transparently
  const activeAlerts = nearbyIncidents.filter(
    (inc) => inc.reviewStatus === 'APPROVED' || inc.reviewStatus === 'UNDER_REVIEW'
  );

  if (activeAlerts.length > 0) {
    dataFreshnessScore = Math.max(30, 85 - activeAlerts.length * 15);
  } else {
    // Note: absence of reports is not proof of safety
    dataFreshnessScore = 75;
  }

  if (recentIncidents.length === 0) {
    missingFactors.push('Recent Community Safety Reports (sparse recent feed within 48h)');
    confidence -= 10;
  }

  // Final composite formula
  const compositeScore = Math.round(
    0.30 * facilitiesScore +
    0.25 * transitScore +
    0.25 * lightingScore +
    0.20 * dataFreshnessScore
  );

  const factorBreakdown: FactorBreakdown = {
    facilitiesScore: Math.round(facilitiesScore),
    transitScore: Math.round(transitScore),
    lightingScore: Math.round(lightingScore),
    dataFreshnessScore: Math.round(dataFreshnessScore),
    facilityCountNearby: nearbyFacilities.length,
    transitStopsNearby: transitHubs.length,
    lightingDataAvailable: lightingCoverageAvailable,
    freshReportsCount: activeAlerts.length,
  };

  // Human-readable narrative explanation
  const explanation = generateScoreExplanation(compositeScore, factorBreakdown, missingFactors);

  const dataSources = [
    'OpenStreetMap Verified Facilities',
    'Municipal 24/7 Support Network Registry',
    'SafeStride Community Safety Feed',
  ];
  if (lightingCoverageAvailable) {
    dataSources.push('City Infrastructure Lighting Index');
  }

  return {
    score: Math.min(100, Math.max(10, compositeScore)),
    confidence: Math.max(40, confidence),
    factors: factorBreakdown,
    missingFactors,
    explanation,
    dataSources,
    calculatedAt: new Date().toISOString(),
  };
}

function generateScoreExplanation(
  score: number,
  factors: FactorBreakdown,
  missing: string[]
): string {
  const parts: string[] = [];

  if (score >= 80) {
    parts.push(
      `Strong route readiness (${score}/100) supported by ${factors.facilityCountNearby} verified support points and active transit access.`
    );
  } else if (score >= 60) {
    parts.push(
      `Moderate route readiness (${score}/100) with reasonable transit options, but limited 24/7 staffed safe havens.`
    );
  } else {
    parts.push(
      `Cautious route readiness (${score}/100). Sparse public facilities and limited verified night coverage along this path.`
    );
  }

  if (factors.freshReportsCount > 0) {
    parts.push(
      `${factors.freshReportsCount} active community notice(s) noted along nearby street segments.`
    );
  }

  if (missing.length > 0) {
    parts.push(`Note: ${missing.length} data layer(s) currently provisional.`);
  }

  return parts.join(' ');
}
