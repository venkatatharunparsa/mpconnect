import { describe, it, expect } from "vitest";
import {
  dominantTemplate,
  submissionsToQuarantine,
} from "@/server/services/abuse-cluster";
import type { SubmissionForScoring } from "@/server/services/abuse";

describe("abuse-cluster quarantine targeting", () => {
  const now = new Date();
  const attackTemplate =
    "There is a major pothole on Main Road near the bus stop causing accidents daily";

  it("quarantines only templated texts, not diverse bystanders", () => {
    const cluster: SubmissionForScoring[] = [
      {
        id: "attack-1",
        citizenKey: "ATTACK-1",
        rawText: attackTemplate,
        createdAt: now,
      },
      {
        id: "attack-2",
        citizenKey: "ATTACK-2",
        rawText: attackTemplate,
        createdAt: now,
      },
      {
        id: "innocent",
        citizenKey: "judge-real",
        rawText: "Street light broken near temple in MVP ward for two weeks",
        createdAt: now,
      },
    ];

    const template = dominantTemplate(cluster);
    const targets = submissionsToQuarantine(cluster, template);

    expect(targets).toContain("attack-1");
    expect(targets).toContain("attack-2");
    expect(targets).not.toContain("innocent");
  });
});
