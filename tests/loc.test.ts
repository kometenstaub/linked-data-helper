import {readFileSync} from 'fs';
import {parseJsonHeading} from '../src/methods/parseJson';
import type {headings, LcshInterface, uriToHeading} from '../src/interfaces';

function readJson(fileName: string): LcshInterface {
    const currentFile = readFileSync(`tests/testFiles/${fileName}`, {
        encoding: 'utf-8',
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

function testValues(
    jsonPrefLabel: headings[],
    subdivisions: headings[],
    jsonUriToPrefLabel: uriToHeading,
    fileName: string
) {
    const { pL, aL, bt, nt, rt, note, lcc, uri } = getProperties(
        jsonPrefLabel,
        subdivisions
    );
    if (fileName === 'History-subdiv.json') {
        expect(pL).toBe('History');
        expect(aL).toBe('Frontier troubles');
        expect(lcc).toStrictEqual(undefined);
        expect(note).toBe(
            'Use as a topical subdivision under names of countries, cities, etc., and individual corporate bodies, uniform titles of sacred works, and under classes of persons, ethnic groups, and topical headings.'
        );
        expect(uri).toBe('sh99005024');

        expect(jsonUriToPrefLabel).toStrictEqual({sh99005024: 'History'});
    } else if (fileName === 'Obsidian.json') {
        //@ts-expect-error, the object will not be undefined
        expect(bt[0]).toBe('Volcanic ash, tuff, etc.');
    }
}

/**
 * unit test
 */
test('History URI is correct', () => {
    const obj = readJson('History.json');
    expect(obj['@context'].about).toBe(
        'http://id.loc.gov/authorities/subjects/sh85061227'
    );
});

/**
 * Snapshot tests
 */

test('Snapshot of JSON parsing logic History.json', () => {
    const {jsonPrefLabel, subdivisions, jsonUriToPrefLabel} =
        jsonOutput('History.json');
    if (true) {
        matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    } else {
        testValues(jsonPrefLabel, subdivisions, jsonUriToPrefLabel, 'History.json');
    }
});

test('Snapshot of JSON parsing logic History-subdiv.json', () => {
    const {jsonPrefLabel, subdivisions, jsonUriToPrefLabel} =
        jsonOutput('History-subdiv.json');
    if (true) {
        matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    } else {
        testValues(jsonPrefLabel, subdivisions, jsonUriToPrefLabel, 'History-subdiv.json');
    }
});

test('Snapshot of JSON parsing logic Archaeology.json', () => {
    const {jsonPrefLabel, subdivisions, jsonUriToPrefLabel} =
        jsonOutput('Archaeology.json');
    if (true) {
        matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    } else {
        testValues(jsonPrefLabel, subdivisions, jsonUriToPrefLabel, 'Archaeology.json');
    }
});

test('Snapshot of JSON parsing logic Obsidian.json', () => {
    const {jsonPrefLabel, subdivisions, jsonUriToPrefLabel} =
        jsonOutput('Obsidian.json');
    if (true) {
        matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    } else {
        testValues(jsonPrefLabel, subdivisions, jsonUriToPrefLabel, 'Obsidian.json');
    }
});

/**
 * more unit tests
 */

test('multiple Archaeology properties of JSON objects', () => {
    const { jsonPrefLabel, subdivisions, jsonUriToPrefLabel } =
        jsonOutput('Archaeology.json');
    const {pL, aL, bt, nt, rt, note, lcc, uri} = getProperties(
        jsonPrefLabel,
        subdivisions
    );
    expect(pL).toBe('Archaeology');
    expect(aL).toBe('Archeology');
    expect(lcc).toBe('CC');
    expect(note).toBe(
        'Here are entered works on archaeology as a branch of learning. This heading may be divided geographically for works on this branch of learning in a specific place. Works on the antiquities of particular regions, countries, cities, etc. are entered under the name of the place subdivided by [Antiquities.]'
    );
    expect(uri).toBe('sh85006507');
    expect(rt).toStrictEqual(['sh85005757']);
    expect(subdivisions).toStrictEqual([]);
    expect(jsonUriToPrefLabel).toStrictEqual({sh85006507: 'Archaeology'});
});

test('multiple History-subdiv properties of JSON objects', () => {
    const {jsonPrefLabel, subdivisions, jsonUriToPrefLabel} =
        jsonOutput('History-subdiv.json');
    if (false) {
        matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    } else {
        testValues(jsonPrefLabel, subdivisions, jsonUriToPrefLabel, 'History-subdiv.json');
    }
});

test('broader term Obsidian to not be the ID but the real name', () => {
    const {jsonPrefLabel, subdivisions, jsonUriToPrefLabel} =
        jsonOutput('Obsidian.json');
    if (false) {
        matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    } else {
        testValues(jsonPrefLabel, subdivisions, jsonUriToPrefLabel, 'Obsidian.json');
    }
});
