import { GoogleGenAI, Type } from '@google/genai';
import { JourneyAdviceResponse, CityConfig } from '../types.ts';

/**
 * Server-side Gemini AI integration for SafeStride AI.
 * Uses gemini-3.8-flash with structured JSON response schema and guaranteed deterministic fallback.
 */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function generateJourneyAdvice(params: {
  origin: string;
  destination: string;
  city: CityConfig;
  routeScore: number;
  distanceKm: number;
  durationMins: number;
  nearbyFacilityCount: number;
  timeOfDay?: string;
}): Promise<JourneyAdviceResponse> {
  const {
    origin,
    destination,
    city,
    routeScore,
    distanceKm,
    durationMins,
    nearbyFacilityCount,
    timeOfDay = 'Night (after 8 PM)',
  } = params;

  // Fallback response generator in case AI key is missing or call fails
  const deterministicFallback: JourneyAdviceResponse = {
    routeSummary: `Commute from ${origin} to ${destination} in ${city.name} (${distanceKm.toFixed(1)} km, ~${durationMins} mins walking/transit). Evaluated Route Readiness: ${routeScore}/100 with ${nearbyFacilityCount} verified support points nearby.`,
    keySafetyHighlights: [
      `Stay along well-lit main corridors with frequent pedestrian traffic.`,
      `There are ${nearbyFacilityCount} verified 24/7 support facilities (pharmacies, transit hubs, police posts) along or near this route.`,
      `Ensure phone battery is at least 30% and keep your trusted contacts' check-in notifications active.`,
    ],
    preparationChecklist: [
      'Enable Guardian active check-in with 10-minute intervals before departure.',
      `Keep local emergency shortcut ready (${city.emergencyNumber} or helpline ${city.helplineNumber}).`,
      'Pre-load transit cards or ride-share apps in case rerouting is needed.',
      'Wear accessible footwear and keep one ear free if listening to audio.',
    ],
    recommendedCheckpoints: [
      'Checkpoint 1: Departure station / initial main junction',
      'Checkpoint 2: Midway illuminated transit transfer point',
      'Checkpoint 3: Final 200m approach to destination',
    ],
    disclaimer:
      'AI-generated advice is advisory only and reflects public evidence. Always prioritize immediate situational awareness.',
  };

  if (!process.env.GEMINI_API_KEY) {
    return deterministicFallback;
  }

  try {
    const prompt = `You are SafeStride AI's commute safety intelligence advisor.
Generate practical, empowering, responsible journey-preparation suggestions for a woman commuter traveling through ${city.name}.

Route context:
- Origin: ${origin}
- Destination: ${destination}
- Distance: ${distanceKm.toFixed(1)} km (~${durationMins} minutes)
- Time of Day: ${timeOfDay}
- Route Readiness Evidence Score: ${routeScore}/100
- Verified 24/7 facilities nearby: ${nearbyFacilityCount}
- City Emergency Phone: ${city.emergencyNumber}
- City Helpline: ${city.helplineName} (${city.helplineNumber})

Rules:
1. Do NOT claim absolute safety or make alarmist statements.
2. Focus on practical preparation (battery, checkpoints, well-lit corridors, check-in intervals).
3. Do not invent fake statistics or unverified criminal claims.
4. Keep advice crisp, encouraging, and actionable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            routeSummary: {
              type: Type.STRING,
              description: 'Concise 2-sentence overview of the commute corridor and preparedness focus.',
            },
            keySafetyHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 key factual safety highlights based on transit and facility availability.',
            },
            preparationChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4 concrete pre-departure checklist action items.',
            },
            recommendedCheckpoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 recommended check-in checkpoints along the route.',
            },
          },
          required: [
            'routeSummary',
            'keySafetyHighlights',
            'preparationChecklist',
            'recommendedCheckpoints',
          ],
        },
      },
    });

    const rawText = response.text;
    if (rawText) {
      const parsed = JSON.parse(rawText);
      return {
        routeSummary: parsed.routeSummary || deterministicFallback.routeSummary,
        keySafetyHighlights: parsed.keySafetyHighlights || deterministicFallback.keySafetyHighlights,
        preparationChecklist: parsed.preparationChecklist || deterministicFallback.preparationChecklist,
        recommendedCheckpoints: parsed.recommendedCheckpoints || deterministicFallback.recommendedCheckpoints,
        disclaimer: deterministicFallback.disclaimer,
      };
    }

    return deterministicFallback;
  } catch (err) {
    console.warn('[SafeStride AI] Gemini advice generation failed, falling back to deterministic advice:', err);
    return deterministicFallback;
  }
}
