import * as chai from "chai";
import { computeProgress } from "./computeProgress";
import { checklistSchemaType } from "@/models/checklist";

const { expect } = chai;

describe("computeProgress", () => {
  const mockChecklist: checklistSchemaType = [
    {
      title: "Section 1",
      items: [
        { id: "item-1", title: "Item 1" },
        { id: "item-2", title: "Item 2" },
        { id: "item-3", title: "Item 3" },
      ],
    },
    {
      title: "Section 2",
      items: [
        { id: "item-4", title: "Item 4" },
        { id: "item-5", title: "Item 5" },
      ],
    },
  ];

  it("should return 0 when no items are completed", () => {
    const userEventIds: string[] = [];
    const progress = computeProgress(userEventIds, mockChecklist);
    expect(progress).to.equal(0);
  });

  it("should return 100 when all items are completed", () => {
    const userEventIds = ["item-1", "item-2", "item-3", "item-4", "item-5"];
    const progress = computeProgress(userEventIds, mockChecklist);
    expect(progress).to.equal(100);
  });

  it("should return 40 when 2 out of 5 items are completed", () => {
    const userEventIds = ["item-1", "item-2"];
    const progress = computeProgress(userEventIds, mockChecklist);
    const expectedProgress = (2 / 5) * 100; // 40%
    expect(progress).to.equal(expectedProgress);
  });

  it("should return 60 when 3 out of 5 items are completed", () => {
    const userEventIds = ["item-1", "item-3", "item-4"];
    const progress = computeProgress(userEventIds, mockChecklist);
    const expectedProgress = (3 / 5) * 100; // 60%
    expect(progress).to.equal(expectedProgress);
  });

  it("should handle extra items in userEventIds that don't match checklist", () => {
    const userEventIds = ["item-1", "item-2", "non-existent-item"];
    const progress = computeProgress(userEventIds, mockChecklist);
    const expectedProgress = (2 / 5) * 100; // 40%, only matching items count
    expect(progress).to.equal(expectedProgress);
  });

  it("should return 0 when checklist is empty", () => {
    const userEventIds = ["item-1"];
    const emptyChecklist: checklistSchemaType = [];
    const progress = computeProgress(userEventIds, emptyChecklist);
    expect(progress).to.equal(0);
  });

  it("should handle checklist with empty sections", () => {
    const checklistWithEmptySections: checklistSchemaType = [
      {
        title: "Empty Section",
        items: [],
      },
      {
        title: "Section with items",
        items: [
          { id: "item-1", title: "Item 1" },
          { id: "item-2", title: "Item 2" },
        ],
      },
    ];
    const userEventIds = ["item-1"];
    const progress = computeProgress(userEventIds, checklistWithEmptySections);
    const expectedProgress = (1 / 2) * 100; // 50%
    expect(progress).to.equal(expectedProgress);
  });

  it("should be case-sensitive when matching item IDs", () => {
    const userEventIds = ["Item-1"]; // Different case
    const progress = computeProgress(userEventIds, mockChecklist);
    expect(progress).to.equal(0); // Should not match "item-1"
  });

  it("should handle duplicate user event IDs correctly", () => {
    const userEventIds = ["item-1", "item-1", "item-2"]; // Duplicates
    const progress = computeProgress(userEventIds, mockChecklist);
    const expectedProgress = (2 / 5) * 100; // 40%, duplicates don't add extra progress
    expect(progress).to.equal(expectedProgress);
  });
});
