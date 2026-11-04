import { expect } from "chai";
import { subYears } from "date-fns";

import { getLastMissionDate } from "@/lib/member.utils";

describe("getLastMissionDate", () => {
  it("should show no end date when a mission is open, whatever the order", () => {
    const longAgo = subYears(new Date(), 2);
    const missions = [
      { start: longAgo, end: null },
      { start: longAgo, end: longAgo },
    ] as never[];
    expect(getLastMissionDate(missions)).to.equal(null);
  });
});
