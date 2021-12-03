import {readFileSync} from 'fs';
import type {LcshInterface} from "../resources/LC/lcsh-interface";

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