import { readFileSync } from 'fs';
import { parseJsonHeading } from '../src/methods/parseJson';
import type {headings, LcshInterface, uriToHeading} from '../src/interfaces';
import {match} from "assert";

function readJson(fileName: string): LcshInterface {
    const currentFile = readFileSync(`tests/testFiles/${fileName}`, {
        encoding: 'utf-8',
    });
    return JSON.parse(currentFile);
}

function snapshotJsonParsing(filename: string, snapshot: boolean) {
    const obj = readJson(filename);
    const jsonPrefLabel: headings[] = [];
    const subdivisions: headings[] = [];
    const jsonUriToPrefLabel: uriToHeading= {};
    parseJsonHeading(obj, jsonPrefLabel, subdivisions, jsonUriToPrefLabel);
    if (snapshot) {
        matchSnapshot(jsonPrefLabel, subdivisions, jsonUriToPrefLabel)
    } else {
        return {jsonPrefLabel, subdivisions, jsonUriToPrefLabel }
    }
}

function matchSnapshot(jsonPrefLabel: headings[], subdivisions: headings[], jsonUriToPrefLabel: uriToHeading) {
    expect(jsonPrefLabel).toMatchSnapshot();
    expect(subdivisions).toMatchSnapshot();
    expect(jsonUriToPrefLabel).toMatchSnapshot();
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
    snapshotJsonParsing('History.json', true);
});

test('Snapshot of JSON parsing logic History-subdiv.json', () => {
    snapshotJsonParsing('Archaeology.json', true);
});

test('Snapshot of JSON parsing logic Archaeology.json', () => {
    snapshotJsonParsing('Archaeology.json', true);
});

test('Snapshot of JSON parsing logic Obsidian.json', () => {
    snapshotJsonParsing('Obsidian.json', true);
});

/**
 * more unit tests
 */

//test('Archaeology properties of JSON objects', () => {
//    snapshotJsonParsing('Archaeology.json', false);
//});
