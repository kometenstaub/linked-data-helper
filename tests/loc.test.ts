import {readFileSync} from 'fs';
import {parseJsonHeading} from "../src/methods/parseJson";
import type {headings, LcshInterface} from "../src/interfaces";

function readJson(fileName: string): LcshInterface {
    const currentFile = readFileSync(`tests/testFiles/${fileName}`, {encoding: 'utf-8'});
    return JSON.parse(currentFile);

}


test('History URI is correct', () => {
    const obj = readJson('History.json')
    expect(
        obj['@context'].about
    ).toBe("http://id.loc.gov/authorities/subjects/sh85061227");
});

test('test 2', () => {
    const obj = readJson('History.json')
    const jsonPrefLabel: headings[] = [];
    const subdivisions: headings[] = [];
    const jsonUriToPrefLabel = {};
    parseJsonHeading(obj, jsonPrefLabel, subdivisions, jsonUriToPrefLabel)
    //expect(
    //    obj['@context'].about
    //).toBe("http://id.loc.gov/authorities/subjects/sh85061227");
});
