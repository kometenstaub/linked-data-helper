import { readFileSync } from 'fs';
import { parseJsonHeading } from '../src/methods/parseJson';
import type { headings, LcshInterface } from '../src/interfaces';

function readJson(fileName: string): LcshInterface {
    const currentFile = readFileSync(`tests/testFiles/${fileName}`, {
        encoding: 'utf-8',
    });
    return JSON.parse(currentFile);
}

function snapshotJsonParsing(filename: string) {
    const obj = readJson(filename);
    const jsonPrefLabel: headings[] = [];
    const subdivisions: headings[] = [];
    const jsonUriToPrefLabel = {};
    parseJsonHeading(obj, jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    expect(jsonPrefLabel).toMatchSnapshot();
    expect(subdivisions).toMatchSnapshot();
    expect(jsonUriToPrefLabel).toMatchSnapshot();
}
test('History URI is correct', () => {
    const obj = readJson('History.json');
    expect(obj['@context'].about).toBe(
        'http://id.loc.gov/authorities/subjects/sh85061227'
    );
});

test('Snapshot of JSON parsing logic History.json', () => {
    snapshotJsonParsing('History.json');
});

test('Snapshot of JSON parsing logic History-subdiv.json', () => {
    snapshotJsonParsing('Archaeology.json');
});

test('Snapshot of JSON parsing logic Archaeology.json', () => {
    snapshotJsonParsing('Archaeology.json');
});

test('Snapshot of JSON parsing logic Obsidian.json', () => {
    snapshotJsonParsing('Obsidian.json');
});
