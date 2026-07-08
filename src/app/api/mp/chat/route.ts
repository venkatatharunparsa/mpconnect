import { NextRequest } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { db } from "@/server/db";
import { demands, events } from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { jsonOk, jsonError, handleApiError, parseJsonBody } from "@/server/services/intake/api-helpers";
import { withTracing } from "@/server/core/logger";

// Read-only database query tools
async function queryDemands(category?: string, ward?: string) {
  const conditions = [eq(demands.visibility, "public")];
  if (category) conditions.push(eq(demands.category, category));
  if (ward) conditions.push(eq(demands.ward, ward));

  return db
    .select({
      id: demands.id,
      title: demands.title,
      category: demands.category,
      ward: demands.ward,
      state: demands.state,
      affectedCount: demands.affectedCount,
      urgency: demands.urgency,
      rankScore: demands.rankScore,
    })
    .from(demands)
    .where(and(...conditions))
    .limit(20);
}

async function getStats(ward?: string) {
  const all = await db
    .select({
      state: demands.state,
      affectedCount: demands.affectedCount,
      ward: demands.ward,
    })
    .from(demands);
  
  const filtered = ward ? all.filter((d) => d.ward === ward) : all;
  const total = filtered.length;
  const solved = filtered.filter((d) => d.state === "resolved_verified").length;
  const unsolved = total - solved;
  const citizensHeard = filtered.reduce((sum, d) => sum + d.affectedCount, 0);

  return { total, solved, unsolved, citizensHeard };
}

async function getEscalations() {
  const escalatedRows = await db
    .select({ demandId: events.demandId })
    .from(events)
    .where(eq(events.eventType, "Escalated"));
  const ids = escalatedRows.map((r) => r.demandId).filter((id): id is string => id !== null);
  
  if (ids.length === 0) return [];
  
  return db
    .select({
      id: demands.id,
      title: demands.title,
      category: demands.category,
      ward: demands.ward,
      state: demands.state,
      affectedCount: demands.affectedCount,
    })
    .from(demands)
    .where(and(eq(demands.visibility, "public"), inArray(demands.id, ids)));
}

export async function POST(req: NextRequest) {
  return withTracing(req, async () => {
    try {
      const body = (await parseJsonBody(req)) as any;
      const message = typeof body === "object" && body !== null ? String(body.message) : undefined;
      if (!message) return jsonError("Message is required", 400);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return jsonError("Gemini API key not configured", 500);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: `You are the MPconnect AI Command Assistant. Your goal is to answer internal questions from the Member of Parliament regarding the Visakhapatnam Loksabha constituency dashboard dataset. 
        You have read-only tools to retrieve demands, statistics, and escalated items.
        Always cite exact numbers and source categories/wards retrieved from the database. Under no circumstances invent details.
        Exclude personal/PII-flagged categories from queries if they arise.`,
        tools: [
          {
            functionDeclarations: [
              {
                name: "queryDemands",
                description: "Queries public GVMC demands with optional filters.",
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {
                    category: { type: SchemaType.STRING, description: "Filter category (e.g. school_upgrade, streetlights, drainage, potholes_roads)." },
                    ward: { type: SchemaType.STRING, description: "Filter ward name (e.g. gajuwaka, mvp, bheemili)." }
                  }
                }
              },
              {
                name: "getStats",
                description: "Get count statistics (total, solved, unsolved, citizensHeard) of constituency demands.",
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {
                    ward: { type: SchemaType.STRING, description: "Optional ward name filter." }
                  }
                }
              },
              {
                name: "getEscalations",
                description: "Get all demands that are currently escalated due to SLA breach.",
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {}
                }
              }
            ]
          }
        ]
      });

      // Step 1: Initial invocation to allow tool detection
      const chat = model.startChat();
      const result = await chat.sendMessage(message);
      const response = result.response;
      const functionCalls = response.functionCalls ? response.functionCalls() : [];

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        let resultData: any = null;

        if (call.name === "queryDemands") {
          const args: any = call.args;
          resultData = await queryDemands(args.category, args.ward);
        } else if (call.name === "getStats") {
          const args: any = call.args;
          resultData = await getStats(args.ward);
        } else if (call.name === "getEscalations") {
          resultData = await getEscalations();
        }

        // Send function execution result back to get the final cited response
        const finalResult = await chat.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: { result: resultData }
            }
          }
        ]);

        return jsonOk({ answer: finalResult.response.text() });
      }

      return jsonOk({ answer: response.text() });
    } catch (err) {
      return handleApiError(err);
    }
  });
}
