import { readFileSync } from "fs";
import { parseJsonHeading } from "../src/methods/parseJson";
import type { headings, LcshInterface, uriToHeading } from "../src/interfaces";

function readJson(fileName: string): LcshInterface {
    const currentFile = readFileSync(`tests/testFiles/${fileName}`, {
        encoding: "utf-8",
    });
    return JSON.parse(currentFile);
}

function jsonOutput(filename: string) {
    const obj = readJson(filename);
    const jsonPrefLabel: headings[] = [];
    const subdivisions: headings[] = [];
    const jsonUriToPrefLabel: uriToHeading = {};
    parseJsonHeading(obj, jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    return { jsonPrefLabel, subdivisions, jsonUriToPrefLabel };
}

function matchSnapshot(
    jsonPrefLabel: headings[],
    subdivisions: headings[],
    jsonUriToPrefLabel: uriToHeading
) {
    expect(jsonPrefLabel).toMatchSnapshot();
    expect(subdivisions).toMatchSnapshot();
    expect(jsonUriToPrefLabel).toMatchSnapshot();
}

function getProperties(jsonPrefLabel: headings[], subdivisions: headings[]) {
    let pL, aL, bt, nt, rt, note, lcc, uri;
    const heading = jsonPrefLabel[0];
    const subdivs = subdivisions[0];
    if (heading !== undefined) {
        ({ pL, aL, bt, nt, rt, note, lcc, uri } = heading);
    } else {
        ({ pL, aL, bt, nt, rt, note, lcc, uri } = subdivs);
    }
    return { pL, aL, bt, nt, rt, note, lcc, uri };
}
/**
 * unit test
 */
test("History URI is correct", () => {
    const obj = readJson("History.json");
    expect(obj["@id"]).toBe("/authorities/subjects/sh85061227");
});

/**
 * Snapshot tests
 */

test("Snapshot of JSON parsing logic History.json", () => {
    const { jsonPrefLabel, subdivisions, jsonUriToPrefLabel } =
        jsonOutput("History.json");
    matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
});

test("Snapshot of JSON parsing logic History-subdiv.json", () => {
    const { jsonPrefLabel, subdivisions, jsonUriToPrefLabel } = jsonOutput(
        "History-subdiv.json"
    );
    matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
});

test("Snapshot of JSON parsing logic Archaeology.json", () => {
    const { jsonPrefLabel, subdivisions, jsonUriToPrefLabel } =
        jsonOutput("Archaeology.json");
    matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
});

test("Snapshot of JSON parsing logic Obsidian.json", () => {
    const { jsonPrefLabel, subdivisions, jsonUriToPrefLabel } =
        jsonOutput("Obsidian.json");
    matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
});

/**
 * more unit tests
 */

test("multiple Archaeology properties of JSON objects", () => {
    const { jsonPrefLabel, subdivisions, jsonUriToPrefLabel } =
        jsonOutput("Archaeology.json");
    const { pL, aL, bt, nt, rt, note, lcc, uri } = getProperties(
        jsonPrefLabel,
        subdivisions
    );
    const expectedPL = "Archaeology";
    expect(pL).toBe(expectedPL);
    expect(aL).toStrictEqual(["Archeology"]);
    expect(lcc).toBe("CC");
    expect(note).toBe(
        "Here are entered works on archaeology as a branch of learning. This heading may be divided geographically for works on this branch of learning in a specific place. Works on the antiquities of particular regions, countries, cities, etc. are entered under the name of the place subdivided by [Antiquities.]"
    );
    expect(uri).toBe("sh85006507");
    expect((bt as string[]).length).toEqual(3);
    expect((nt as string[]).length).toEqual(64);
    expect(rt).toStrictEqual(["sh85005757"]);
    expect(subdivisions).toStrictEqual([]);
    expect(jsonUriToPrefLabel).toStrictEqual({ sh85006507: expectedPL });
});

test("multiple History-subdiv properties of JSON objects", () => {
    const { jsonPrefLabel, subdivisions, jsonUriToPrefLabel } = jsonOutput(
        "History-subdiv.json"
    );
    const { pL, aL, bt, nt, rt, note, lcc, uri } = getProperties(
        jsonPrefLabel,
        subdivisions
    );
    const expectedPL = "History";
    expect(pL).toBe(expectedPL);
    expect(aL).toStrictEqual(["Frontier troubles"]);
    expect(lcc).toStrictEqual(undefined);
    expect(note).toBe(
        "Use as a topical subdivision under names of countries, cities, etc., and individual corporate bodies, uniform titles of sacred works, and under classes of persons, ethnic groups, and topical headings."
    );
    expect(uri).toBe("sh99005024");
    expect(jsonUriToPrefLabel).toStrictEqual({ sh99005024: expectedPL });
});

test("broader term is the ID", () => {
    const { jsonPrefLabel, subdivisions, jsonUriToPrefLabel } =
        jsonOutput("Obsidian.json");
    const { pL, aL, bt, nt, rt, note, lcc, uri } = getProperties(
        jsonPrefLabel,
        subdivisions
    );
    //@ts-expect-error, the object will not be undefined
    expect(bt[0]).toBe("sh85144250");
});
