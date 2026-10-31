import { expect } from "chai";
import { z } from "zod";

import { teamUpdateSchema } from "./actions/team";
import { incubatorPatchSchema } from "./api/incubator";
import { startupPatchSchema } from "./api/startup";
import { MAX_RELATED_IDS, MAX_TAGS, MAX_TEAM_MEMBERS } from "./arrayLimits";

const invalidItems = (count: number) => Array.from({ length: count }, () => 1);

const expectSingleTooBig = (schema: z.ZodType, data: unknown, path: string) => {
  const result = schema.safeParse(data);
  expect(result.success).to.be.false;
  expect(
    result.error!.issues.map((issue) => [issue.code, issue.path.join(".")]),
  ).to.deep.equal([["too_big", path]]);
};

describe("array limits", () => {
  it("should reject an oversized API v1 startup patch with a single issue", () => {
    expectSingleTooBig(
      startupPatchSchema,
      { techno: invalidItems(200_000) },
      "techno",
    );
  });

  it("should reject an oversized API v1 incubator patch with a single issue", () => {
    expectSingleTooBig(
      incubatorPatchSchema,
      { highlighted_startups: invalidItems(MAX_RELATED_IDS + 1) },
      "highlighted_startups",
    );
  });

  it("should reject an oversized team update with a single issue", () => {
    expectSingleTooBig(
      teamUpdateSchema,
      {
        team: { name: "Équipe", mission: "Mission", incubator_id: "x" },
        members: invalidItems(200_000),
      },
      "members",
    );
  });

  it("should still report each invalid item under the limit", () => {
    const result = startupPatchSchema.safeParse({
      techno: invalidItems(MAX_TAGS),
    });
    expect(result.error!.issues).to.have.length(MAX_TAGS);
  });

  it("should accept a team at the limit", () => {
    const members = Array.from({ length: MAX_TEAM_MEMBERS }, (_, i) => `m${i}`);
    const result = teamUpdateSchema.shape.members.safeParse(members);
    expect(result.success).to.be.true;
  });
});
