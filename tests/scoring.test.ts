import {
  calculateRouteReadiness,
  calculateDistanceKm,
  isPointNearRoute,
  ROUTE_DISCLAIMER,
} from '../src/lib/scoring/readiness.ts';
import { SafetyFacility, IncidentReport } from '../src/lib/types.ts';

function runUnitTests() {
  console.log('🧪 [SafeStride AI] Starting Scoring Engine Unit Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Distance calculation
  const sfPoint1: [number, number] = [-122.4194, 37.7749];
  const sfPoint2: [number, number] = [-122.4098, 37.7997];
  const dist = calculateDistanceKm(sfPoint1, sfPoint2);
  assert(dist > 2.5 && dist < 3.2, `Haversine distance between Civic Center and North Beach (~2.8 km): Got ${dist.toFixed(2)} km`);

  // Test 2: Buffer check
  const routePoints: [number, number][] = [
    [-122.40, 37.78],
    [-122.41, 37.78],
    [-122.42, 37.78],
  ];
  const nearPoint: [number, number] = [-122.415, 37.781];
  const farPoint: [number, number] = [-122.50, 37.85];
  assert(isPointNearRoute(nearPoint, routePoints, 0.5), 'Point near route correctly detected inside 500m buffer');
  assert(!isPointNearRoute(farPoint, routePoints, 0.5), 'Distant point correctly excluded outside buffer');

  // Test 3: Route readiness formula calculation with verified facilities
  const sampleFacilities: SafetyFacility[] = [
    {
      _id: 'fac_1',
      name: 'Safe Haven 24/7',
      facilityType: 'safe_haven',
      city: 'karur',
      location: { type: 'Point', coordinates: [-122.41, 37.78] },
      address: 'Market St',
      operatingHours: '24/7',
      sourceName: 'Sample Data',
      verificationStatus: 'verified',
      verifiedAt: '2026-10-01',
      createdAt: '2026-10-01',
    },
    {
      _id: 'fac_2',
      name: 'Police Precinct',
      facilityType: 'police',
      city: 'karur',
      location: { type: 'Point', coordinates: [-122.412, 37.781] },
      address: '7th St',
      operatingHours: '24/7',
      sourceName: 'Sample Data',
      verificationStatus: 'verified',
      verifiedAt: '2026-10-01',
      createdAt: '2026-10-01',
    },
  ];

  const assessment = calculateRouteReadiness({
    originCoords: [-122.40, 37.78],
    destinationCoords: [-122.42, 37.78],
    routeCoordinates: routePoints,
    facilities: sampleFacilities,
    lightingCoverageAvailable: true,
  });

  assert(assessment.score >= 60 && assessment.score <= 100, `Score is within expected 60-100 range: Got ${assessment.score}`);
  assert(assessment.factors.facilityCountNearby === 2, `Identified 2 nearby facilities: Got ${assessment.factors.facilityCountNearby}`);
  assert(assessment.confidence >= 80, `High confidence when lighting dataset is present: Got ${assessment.confidence}%`);

  // Test 4: Missing data handling reduces confidence and records missing factor
  const missingDataAssessment = calculateRouteReadiness({
    originCoords: [-122.40, 37.78],
    destinationCoords: [-122.42, 37.78],
    routeCoordinates: routePoints,
    facilities: [],
    lightingCoverageAvailable: false,
  });

  assert(
    missingDataAssessment.missingFactors.length > 0,
    `Missing factors explicitly registered: Got ${missingDataAssessment.missingFactors.length} missing factor(s)`
  );
  assert(
    missingDataAssessment.confidence < assessment.confidence,
    `Confidence is penalized when data is missing: Got ${missingDataAssessment.confidence}% vs ${assessment.confidence}%`
  );

  // Test 5: Mandatory safety disclaimer check
  assert(ROUTE_DISCLAIMER.includes('does not guarantee personal safety'), 'Mandatory responsible safety disclaimer is present');

  console.log(`\n📋 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runUnitTests();
