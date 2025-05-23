import chai, { expect } from "chai";
import {
    getFirstMissionDate,
    getLastMissionDate,
    hasActiveMissionInStartup,
    isUserActive,
    hasPreviousMissionInStartup,
} from "./member";

describe("getFirstMissionDate", () => {
    const tests = [
        {
            title: "should pick and format first mission date",
            inputs: [
                { start: new Date("2020-06-01") },
                { start: new Date("2010-06-01") },
                { start: new Date("2030-06-01") },
            ],
            expected: "1 juin 2010",
        },
    ];
    tests.forEach((t) => {
        it(t.title, () => {
            const res = getFirstMissionDate.call(this, t.inputs);
            expect(res).to.equal(t.expected);
        });
    });
});

describe("getLastMissionDate", () => {
    const tests = [
        {
            title: "should pick and format last mission date",
            inputs: [
                { start: new Date("2020-06-01"), end: new Date("2022-06-01") },
                { start: new Date("2030-06-01"), end: new Date("2030-07-01") },
                { start: new Date("2010-06-01"), end: new Date("2013-06-01") },
            ],
            expected: "1 juillet 2030",
        },
    ];
    tests.forEach((t) => {
        it(t.title, () => {
            const res = getLastMissionDate.call(this, t.inputs);
            expect(res).to.equal(t.expected);
        });
    });
});

describe("hasActiveMissionInStartup", () => {
    const tests = [
        {
            title: "should return true if active missions in startup",
            inputs: [
                {
                    missions: [
                        { start: new Date("2020-06-01"), startups: [123] },
                        { start: new Date("2010-06-01"), startups: [456] },
                        { start: new Date("2030-06-01"), startups: [789] },
                    ],
                },
                123,
            ],
            expected: true,
        },
        {
            title: "should return false if no active missions in startup",
            inputs: [
                {
                    missions: [
                        {
                            start: new Date("2020-06-01"),
                            end: new Date("2021-06-01"),
                            startups: [123],
                        },
                        { start: new Date("2010-06-01"), startups: [456] },
                        { start: new Date("2030-06-01"), startups: [789] },
                    ],
                },
                123,
            ],
            expected: false,
        },
    ];
    tests.forEach((t) => {
        it(t.title, () => {
            // @ts-ignore
            const res = hasActiveMissionInStartup.apply(this, t.inputs);
            expect(res).to.equal(t.expected);
        });
    });
});

describe("hasPreviousMissionInStartup", () => {
    const tests = [
        {
            title: "should return true if previous missions in startup",
            inputs: [
                {
                    missions: [
                        {
                            start: new Date("2020-06-01"),
                            end: new Date("2022-06-01"),
                            startups: [123],
                        },
                        { start: new Date("2010-06-01"), startups: [456] },
                        { start: new Date("2030-06-01"), startups: [789] },
                    ],
                },
                123,
            ],
            expected: true,
        },
        {
            title: "should return false if no previous missions in startup",
            inputs: [
                {
                    missions: [
                        {
                            start: new Date("2020-06-01"),
                            end: new Date("2021-06-01"),
                            startups: [999],
                        },
                        { start: new Date("2010-06-01"), startups: [456] },
                        { start: new Date("2030-06-01"), startups: [789] },
                    ],
                },
                123,
            ],
            expected: false,
        },
        {
            title: "should return false if active mission in startup",
            inputs: [
                {
                    missions: [
                        {
                            start: new Date("2020-06-01"),
                            end: new Date("2021-06-01"),
                            startups: [999],
                        },
                        { start: new Date("2010-06-01"), startups: [456] },
                        {
                            start: new Date("2024-06-01"),
                            end: new Date("2040-06-01"),
                            startups: [123],
                        },
                    ],
                },
                123,
            ],
            expected: false,
        },
    ];
    tests.forEach((t) => {
        it(t.title, () => {
            // @ts-ignore
            const res = hasPreviousMissionInStartup.apply(this, t.inputs);
            expect(res).to.equal(t.expected);
        });
    });
});
