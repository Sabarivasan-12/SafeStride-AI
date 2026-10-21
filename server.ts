import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getCollection,
  resetDemoDatabase,
} from './src/lib/db/mongodb.ts';
import {
  calculateRouteReadiness,
  calculateDistanceKm,
} from './src/lib/scoring/readiness.ts';
import { generateJourneyAdvice } from './src/lib/ai/journey-advice.ts';
import {
  SafetyFacility,
  Trip,
  TripCheckin,
  IncidentReport,
  SafetyEvent,
  TrustedContact,
  CITIES,
  CityId,
} from './src/lib/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Demo current user ID (Maya Chen)
const DEMO_USER_ID = 'user_demo_01';

// -------------------------------------------------------------
// Facilities API
// -------------------------------------------------------------
app.get('/api/facilities', async (req: Request, res: Response) => {
  try {
    const facilitiesCol = await getCollection<SafetyFacility>('safetyFacilities');
    const { city, type } = req.query;

    const filter: Record<string, unknown> = {};
    if (city && typeof city === 'string') {
      filter.city = city;
    }
    if (type && typeof type === 'string') {
      filter.facilityType = type;
    }

    const facilities = await facilitiesCol.find(filter);
    res.json({ success: true, data: facilities });
  } catch (err) {
    console.error('Error fetching facilities:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve facilities.' },
    });
  }
});

app.get('/api/facilities/:id', async (req: Request, res: Response) => {
  try {
    const facilitiesCol = await getCollection<SafetyFacility>('safetyFacilities');
    const facility = await facilitiesCol.findOne({ _id: req.params.id });
    if (!facility) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Facility not found.' },
      });
    }
    res.json({ success: true, data: facility });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Error retrieving facility.' },
    });
  }
});

// -------------------------------------------------------------
// Trips API
// -------------------------------------------------------------
app.get('/api/trips', async (req: Request, res: Response) => {
  try {
    const tripsCol = await getCollection<Trip>('trips');
    const trips = await tripsCol.find({ userId: DEMO_USER_ID });
    // Sort recent first
    trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, data: trips });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch trips.' },
    });
  }
});

app.post('/api/trips', async (req: Request, res: Response) => {
  try {
    const { origin, destination, city = 'sf', routeGeometry, checkinIntervalMinutes = 10 } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Origin and destination are required.' },
      });
    }

    const facilitiesCol = await getCollection<SafetyFacility>('safetyFacilities');
    const incidentsCol = await getCollection<IncidentReport>('incidentReports');
    const tripsCol = await getCollection<Trip>('trips');
    const eventsCol = await getCollection<SafetyEvent>('safetyEvents');

    const facilities = await facilitiesCol.find({ city });
    const incidents = await incidentsCol.find({ city });

    // Assess readiness
    const assessment = calculateRouteReadiness({
      originCoords: origin.coordinates,
      destinationCoords: destination.coordinates,
      routeCoordinates: routeGeometry?.coordinates,
      facilities,
      recentIncidents: incidents,
    });

    const distKm = calculateDistanceKm(origin.coordinates, destination.coordinates);
    const estDurationSec = Math.round((distKm / 4.5) * 3600); // approx 4.5 km/h walking

    const newTripId = `trip_${Date.now()}`;
    const newTrip: Trip = {
      _id: newTripId,
      userId: DEMO_USER_ID,
      city: city as CityId,
      origin,
      destination,
      routeGeometry,
      distanceMeters: Math.round(distKm * 1000),
      durationSeconds: estDurationSec,
      status: 'PLANNED',
      checkinIntervalMinutes: Number(checkinIntervalMinutes) || 10,
      routeReadinessScore: assessment.score,
      factorBreakdown: assessment.factors,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await tripsCol.insertOne(newTrip);

    // Record creation event
    await eventsCol.insertOne({
      _id: `evt_${Date.now()}`,
      tripId: newTripId,
      userId: DEMO_USER_ID,
      eventType: 'TRIP_STARTED',
      severity: 'INFO',
      simulationMode: true,
      metadata: {
        score: assessment.score,
        origin: origin.name,
        destination: destination.name,
      },
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: newTrip });
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create journey.' },
    });
  }
});

app.get('/api/trips/:id', async (req: Request, res: Response) => {
  try {
    const tripsCol = await getCollection<Trip>('trips');
    const checkinsCol = await getCollection<TripCheckin>('tripCheckins');
    const eventsCol = await getCollection<SafetyEvent>('safetyEvents');

    const trip = await tripsCol.findOne({ _id: req.params.id, userId: DEMO_USER_ID });
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journey not found.' },
      });
    }

    const checkins = await checkinsCol.find({ tripId: trip._id });
    const events = await eventsCol.find({ tripId: trip._id });

    res.json({
      success: true,
      data: {
        ...trip,
        checkins,
        events,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve journey.' },
    });
  }
});

app.patch('/api/trips/:id', async (req: Request, res: Response) => {
  try {
    const { status, nextCheckinDueAt } = req.body;
    const tripsCol = await getCollection<Trip>('trips');
    const eventsCol = await getCollection<SafetyEvent>('safetyEvents');

    const trip = await tripsCol.findOne({ _id: req.params.id, userId: DEMO_USER_ID });
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journey not found.' },
      });
    }

    const updatePayload: Partial<Trip> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updatePayload.status = status;
      if (status === 'ACTIVE' && !trip.startedAt) {
        updatePayload.startedAt = new Date().toISOString();
        const due = new Date(Date.now() + trip.checkinIntervalMinutes * 60 * 1000).toISOString();
        updatePayload.nextCheckinDueAt = due;
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        updatePayload.endedAt = new Date().toISOString();
        await eventsCol.insertOne({
          _id: `evt_${Date.now()}`,
          tripId: trip._id,
          userId: DEMO_USER_ID,
          eventType: 'TRIP_COMPLETED',
          severity: 'INFO',
          simulationMode: true,
          metadata: { status },
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (nextCheckinDueAt) {
      updatePayload.nextCheckinDueAt = nextCheckinDueAt;
    }

    await tripsCol.updateOne({ _id: trip._id }, { $set: updatePayload });
    const updated = await tripsCol.findOne({ _id: trip._id });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update journey.' },
    });
  }
});

// -------------------------------------------------------------
// Check-In API
// -------------------------------------------------------------
app.post('/api/trips/:id/checkin', async (req: Request, res: Response) => {
  try {
    const tripsCol = await getCollection<Trip>('trips');
    const checkinsCol = await getCollection<TripCheckin>('tripCheckins');
    const eventsCol = await getCollection<SafetyEvent>('safetyEvents');

    const trip = await tripsCol.findOne({ _id: req.params.id, userId: DEMO_USER_ID });
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journey not found.' },
      });
    }

    const now = new Date();
    const existingCheckins = await checkinsCol.find({ tripId: trip._id });
    const checkpointNumber = existingCheckins.length + 1;

    let checkinStatus: 'ON_TIME' | 'LATE' = 'ON_TIME';
    if (trip.nextCheckinDueAt && new Date(trip.nextCheckinDueAt).getTime() < now.getTime()) {
      checkinStatus = 'LATE';
    }

    const checkinDoc: TripCheckin = {
      _id: `chk_${Date.now()}`,
      tripId: trip._id,
      userId: DEMO_USER_ID,
      checkpointNumber,
      dueAt: trip.nextCheckinDueAt || now.toISOString(),
      checkedInAt: now.toISOString(),
      status: checkinStatus,
      createdAt: now.toISOString(),
    };

    await checkinsCol.insertOne(checkinDoc);

    // Compute next check-in deadline
    const intervalMinutes = trip.checkinIntervalMinutes || 10;
    const nextDue = new Date(now.getTime() + intervalMinutes * 60 * 1000).toISOString();

    await tripsCol.updateOne(
      { _id: trip._id },
      {
        $set: {
          status: 'ACTIVE',
          nextCheckinDueAt: nextDue,
          updatedAt: now.toISOString(),
        },
      }
    );

    await eventsCol.insertOne({
      _id: `evt_${Date.now()}`,
      tripId: trip._id,
      userId: DEMO_USER_ID,
      eventType: 'CHECKIN_LOGGED',
      severity: 'INFO',
      simulationMode: true,
      metadata: {
        checkpointNumber,
        status: checkinStatus,
        nextDue,
      },
      createdAt: now.toISOString(),
    });

    res.json({
      success: true,
      data: {
        checkin: checkinDoc,
        nextCheckinDueAt: nextDue,
      },
    });
  } catch (err) {
    console.error('Checkin error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to record check-in.' },
    });
  }
});

// -------------------------------------------------------------
// Safety Assessment API
// -------------------------------------------------------------
app.post('/api/safety/assess', async (req: Request, res: Response) => {
  try {
    const { originCoords, destinationCoords, routeCoordinates, city = 'sf' } = req.body;
    if (!originCoords || !destinationCoords) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Coordinates are required.' },
      });
    }

    const facilitiesCol = await getCollection<SafetyFacility>('safetyFacilities');
    const incidentsCol = await getCollection<IncidentReport>('incidentReports');

    const facilities = await facilitiesCol.find({ city });
    const incidents = await incidentsCol.find({ city });

    const assessment = calculateRouteReadiness({
      originCoords,
      destinationCoords,
      routeCoordinates,
      facilities,
      recentIncidents: incidents,
    });

    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error('Safety assess error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Route assessment failed.' },
    });
  }
});

// -------------------------------------------------------------
// Safety Alert & SOS Simulation API
// -------------------------------------------------------------
app.post('/api/safety/simulate-alert', async (req: Request, res: Response) => {
  try {
    const { tripId, alertType, note } = req.body; // alertType: 'OVERDUE' | 'SOS' | 'CANCEL' | 'RESOLVE'
    const eventsCol = await getCollection<SafetyEvent>('safetyEvents');
    const contactsCol = await getCollection<TrustedContact>('trustedContacts');
    const tripsCol = await getCollection<Trip>('trips');

    const contacts = await contactsCol.find({ userId: DEMO_USER_ID });
    const eventTime = new Date().toISOString();

    let eventType: SafetyEvent['eventType'] = 'CHECKIN_OVERDUE';
    let severity: SafetyEvent['severity'] = 'WARNING';
    let newTripStatus: Trip['status'] = 'ALERT_PENDING';

    if (alertType === 'SOS') {
      eventType = 'SOS_TRIGGERED';
      severity = 'CRITICAL';
      newTripStatus = 'ALERT_SIMULATED';
    } else if (alertType === 'CANCEL') {
      eventType = 'ALERT_CANCELLED';
      severity = 'INFO';
      newTripStatus = 'ACTIVE';
    } else if (alertType === 'RESOLVE') {
      eventType = 'ALERT_RESOLVED';
      severity = 'INFO';
      newTripStatus = 'ACTIVE';
    } else if (alertType === 'OVERDUE') {
      eventType = 'CHECKIN_OVERDUE';
      severity = 'WARNING';
      newTripStatus = 'ALERT_PENDING';
    }

    const simulatedSmsBroadcast = contacts.map((c) => ({
      contactId: c._id,
      name: c.name,
      phone: c.phone,
      simulatedStatus: 'SENT_TO_SIMULATED_GATEWAY',
      simulatedMessage: `[SafeStride Simulated Alert] Maya Chen triggered an alert near her commute route. This is a prototype safety simulation.`,
      dispatchedAt: eventTime,
    }));

    const eventDoc: SafetyEvent = {
      _id: `evt_${Date.now()}`,
      tripId: tripId || 'trip_standalone',
      userId: DEMO_USER_ID,
      eventType,
      severity,
      simulationMode: true,
      metadata: {
        note: note || 'Simulated safety event trigger',
        simulatedSmsBroadcast,
      },
      createdAt: eventTime,
    };

    await eventsCol.insertOne(eventDoc);

    if (tripId) {
      await tripsCol.updateOne({ _id: tripId }, { $set: { status: newTripStatus } });
    }

    res.json({
      success: true,
      data: {
        event: eventDoc,
        simulatedSmsBroadcast,
        newTripStatus,
      },
    });
  } catch (err) {
    console.error('Simulate alert error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to simulate safety alert.' },
    });
  }
});

// -------------------------------------------------------------
// Incident Reports API
// -------------------------------------------------------------
app.get('/api/incidents', async (req: Request, res: Response) => {
  try {
    const incidentsCol = await getCollection<IncidentReport>('incidentReports');
    const { city, category, status } = req.query;

    const filter: Record<string, unknown> = {};
    if (city && typeof city === 'string') filter.city = city;
    if (category && typeof category === 'string') filter.category = category;
    if (status && typeof status === 'string') filter.reviewStatus = status;

    const incidents = await incidentsCol.find(filter);
    incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, data: incidents });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch incident reports.' },
    });
  }
});

app.post('/api/incidents', async (req: Request, res: Response) => {
  try {
    const { category, city = 'sf', coordinates, approximateAddress, description } = req.body;
    if (!category || !coordinates || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required report fields.' },
      });
    }

    const incidentsCol = await getCollection<IncidentReport>('incidentReports');
    const newReport: IncidentReport = {
      _id: `inc_${Date.now()}`,
      reporterId: DEMO_USER_ID,
      category,
      city: city as CityId,
      location: {
        type: 'Point',
        coordinates,
        approximateAddress: approximateAddress || 'Metropolitan commute corridor',
      },
      description,
      occurredAt: new Date().toISOString(),
      reviewStatus: 'UNDER_REVIEW', // Mandatory review status for community submission
      sourceType: 'COMMUNITY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await incidentsCol.insertOne(newReport);
    res.status(201).json({ success: true, data: newReport });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to submit incident report.' },
    });
  }
});

app.patch('/api/incidents/:id/review', async (req: Request, res: Response) => {
  try {
    const { reviewStatus, moderationNotes } = req.body;
    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid review status.' },
      });
    }

    const incidentsCol = await getCollection<IncidentReport>('incidentReports');
    await incidentsCol.updateOne(
      { _id: req.params.id },
      {
        $set: {
          reviewStatus,
          moderationNotes: moderationNotes || `Reviewed by moderator on ${new Date().toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const updated = await incidentsCol.findOne({ _id: req.params.id });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update report status.' },
    });
  }
});

// -------------------------------------------------------------
// Trusted Contacts API
// -------------------------------------------------------------
app.get('/api/contacts', async (req: Request, res: Response) => {
  try {
    const contactsCol = await getCollection<TrustedContact>('trustedContacts');
    const contacts = await contactsCol.find({ userId: DEMO_USER_ID });
    res.json({ success: true, data: contacts });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch contacts.' },
    });
  }
});

app.post('/api/contacts', async (req: Request, res: Response) => {
  try {
    const { name, phone, relationship, notifyOnCheckinMissed = true, notifyOnSos = true } = req.body;
    if (!name || !phone || !relationship) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, phone, and relationship are required.' },
      });
    }

    const contactsCol = await getCollection<TrustedContact>('trustedContacts');
    const newContact: TrustedContact = {
      _id: `contact_${Date.now()}`,
      userId: DEMO_USER_ID,
      name,
      phone,
      relationship,
      consentStatus: 'verified',
      notifyOnCheckinMissed: Boolean(notifyOnCheckinMissed),
      notifyOnSos: Boolean(notifyOnSos),
      createdAt: new Date().toISOString(),
    };

    await contactsCol.insertOne(newContact);
    res.status(201).json({ success: true, data: newContact });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to add contact.' },
    });
  }
});

app.delete('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const contactsCol = await getCollection<TrustedContact>('trustedContacts');
    const deleted = await contactsCol.deleteOne({ _id: req.params.id, userId: DEMO_USER_ID });
    res.json({ success: deleted });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to remove contact.' },
    });
  }
});

// -------------------------------------------------------------
// Gemini AI Journey Advice API
// -------------------------------------------------------------
app.post('/api/ai/journey-advice', async (req: Request, res: Response) => {
  try {
    const {
      origin,
      destination,
      cityId = 'karur',
      routeScore = 78,
      distanceKm = 2.4,
      durationMins = 30,
      nearbyFacilityCount = 4,
    } = req.body;

    const city = CITIES[cityId as CityId] || CITIES.karur;
    const advice = await generateJourneyAdvice({
      origin: origin || city.defaultOrigin.name,
      destination: destination || city.defaultDestination.name,
      city,
      routeScore: Number(routeScore) || 75,
      distanceKm: Number(distanceKm) || 2.5,
      durationMins: Number(durationMins) || 30,
      nearbyFacilityCount: Number(nearbyFacilityCount) || 3,
    });

    res.json({ success: true, data: advice });
  } catch (err) {
    console.error('AI journey advice route error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'AI_ERROR', message: 'Failed to generate journey advice.' },
    });
  }
});

// -------------------------------------------------------------
// Reset Demo Seed API
// -------------------------------------------------------------
app.post('/api/demo/reset', (req: Request, res: Response) => {
  try {
    resetDemoDatabase();
    res.json({ success: true, message: 'Database reseeded to default clean state.' });
  } catch {
    res.status(500).json({ success: false, error: { message: 'Reset failed.' } });
  }
});

// -------------------------------------------------------------
// Frontend Integration (Vite Middleware in dev / Static in prod)
// -------------------------------------------------------------
async function setupFrontend() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }
}

setupFrontend().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SafeStride AI] Full-stack server running on port ${PORT}`);
  });
});
