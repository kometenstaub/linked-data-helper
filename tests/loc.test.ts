import { readFileSync } from 'fs';
import { parseJsonHeading } from '../src/methods/parseJson';
import type { headings, LcshInterface, uriToHeading } from '../src/interfaces';

function readJson(fileName: string): LcshInterface {
    const currentFile = readFileSync(`tests/testFiles/${fileName}`, {
        encoding: 'utf-8',
    });
    return JSON.parse(currentFile);
}

function jsonParsing(filename: string, snapshot: boolean) {
    const obj = readJson(filename);
    const jsonPrefLabel: headings[] = [];
    const subdivisions: headings[] = [];
    const jsonUriToPrefLabel: uriToHeading = {};
    parseJsonHeading(obj, jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    if (snapshot) {
        matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    } else {
        testValues(jsonPrefLabel, subdivisions, jsonUriToPrefLabel, filename);
    }
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

function testValues(
    jsonPrefLabel: headings[],
    subdivisions: headings[],
    jsonUriToPrefLabel: uriToHeading,
    fileName: string
) {
    let pL, aL, bt, nt, rt, note, lcc, uri;
    const heading = jsonPrefLabel[0];
    const subdivs = subdivisions[0];
    if (heading !== undefined) {
        ({ pL, aL, bt, nt, rt, note, lcc, uri } = heading);
    } else {
        ({ pL, aL, bt, nt, rt, note, lcc, uri } = subdivs);
    }
    if (fileName === 'Archaeology.json') {
        expect(pL).toBe('Archaeology');
        expect(aL).toBe('Archeology');
        expect(lcc).toBe('CC');
        expect(note).toBe(
            'Here are entered works on archaeology as a branch of learning. This heading may be divided geographically for works on this branch of learning in a specific place. Works on the antiquities of particular regions, countries, cities, etc. are entered under the name of the place subdivided by [Antiquities.]'
        );
        expect(uri).toBe('sh85006507');
        expect(rt).toStrictEqual(['sh85005757']);

        expect(subdivisions).toStrictEqual([]);

        expect(jsonUriToPrefLabel).toStrictEqual({ sh85006507: 'Archaeology' });
    } else if (fileName === 'History-subdiv.json') {
        expect(pL).toBe('History');
        expect(aL).toBe('Frontier troubles');
        expect(lcc).toStrictEqual(undefined);
        expect(note).toBe(
            'Use as a topical subdivision under names of countries, cities, etc., and individual corporate bodies, uniform titles of sacred works, and under classes of persons, ethnic groups, and topical headings.'
        );
        expect(uri).toBe('sh99005024');

        expect(jsonUriToPrefLabel).toStrictEqual({ sh99005024: 'History' });
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
    jsonParsing('History.json', true);
});

test('Snapshot of JSON parsing logic History-subdiv.json', () => {
    jsonParsing('History-subdiv.json', true);
});

test('Snapshot of JSON parsing logic Archaeology.json', () => {
    jsonParsing('Archaeology.json', true);
});

test('Snapshot of JSON parsing logic Obsidian.json', () => {
    jsonParsing('Obsidian.json', true);
});

/**
 * more unit tests
 */

test('multiple Archaeology properties of JSON objects', () => {
    jsonParsing('Archaeology.json', false);
});

test('multiple History-subdiv properties of JSON objects', () => {
    jsonParsing('History-subdiv.json', false);
});

test('broader term Obsidian to not be the ID but the real name', () => {
    jsonParsing('Obsidian.json', false);
});
