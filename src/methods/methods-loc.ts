import { App, normalizePath, Notice } from 'obsidian';
import type LinkedDataHelperPlugin from '../main';
import type { headings, LcshInterface } from '../interfaces';
import { createReadStream } from 'fs';
import split2 from 'split2';
import { parseJsonHeading } from './parseJson';
import * as fs from 'fs';

export class SkosMethods {
    app: App;
    plugin: LinkedDataHelperPlugin;

    constructor(app: App, plugin: LinkedDataHelperPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    public convertLcshSkosNdjson(outputPath?: string) {
        const jsonPrefLabel: headings[] = [];
        const subdivisions: headings[] = [];
        const jsonUriToPrefLabel = {};
        let inputPath = '';
        if (fs.existsSync(this.plugin.settings.lcshInputPath)) {
            inputPath = this.plugin.settings.lcshInputPath;
        } else {
            const message =
                'The file could not be read. Please check the path you provided.';
            new Notice(message);
            throw Error(message);
        }
        let newOutputPath = '';
        if (outputPath) {
            newOutputPath = outputPath;
        }

        createReadStream(inputPath)
            .pipe(split2(JSON.parse))
            .on('error', () => {
                new Notice('Something went wrong while parsing the file.');
            })
            .on('data', (obj: LcshInterface) => {
                parseJsonHeading(
                    obj,
                    jsonPrefLabel,
                    subdivisions,
                    jsonUriToPrefLabel
                );
            })
            .on('end', () => {
                let jsonPrefPath = '';
                let jsonUriPath = '';
                let jsonSubdivPath = '';
                const { adapter } = this.app.vault;
                if (newOutputPath === '') {
                    const attachmentFolder = normalizePath(
                        this.app.vault.config.attachmentFolderPath +
                            '/' +
                            'linked-data-vocabularies/'
                    );
                    (async () => {
                        const isDir = await adapter.exists(attachmentFolder);
                        if (!isDir) {
                            adapter.mkdir(attachmentFolder);
                        }
                    })();
                    // prettier-ignore
                    (async () => {
                        jsonPrefPath = normalizePath(attachmentFolder + '/' + 'lcshSuggester.json');
                        jsonUriPath = normalizePath(attachmentFolder + '/' + 'lcshUriToPrefLabel.json');
                        jsonSubdivPath = normalizePath(attachmentFolder + '/' + 'lcshSubdivSuggester.json');
                        adapter.write(jsonPrefPath, JSON.stringify(jsonPrefLabel));
                        adapter.write(jsonUriPath, JSON.stringify(jsonUriToPrefLabel));
                        adapter.write(jsonSubdivPath, JSON.stringify(subdivisions));
                    })();
                } else {
                    jsonPrefPath = normalizePath(
                        newOutputPath + '/' + 'lcshSuggester.json'
                    );
                    jsonUriPath = normalizePath(
                        newOutputPath + '/' + 'lcshUriToPrefLabel.json'
                    );
                    jsonSubdivPath = normalizePath(
                        newOutputPath + '/' + 'lcshSubdivSuggester.json'
                    );
                    adapter.write(jsonPrefPath, JSON.stringify(jsonPrefLabel));
                    // prettier-ignore
                    adapter.write(jsonUriPath, JSON.stringify(jsonUriToPrefLabel));
                    adapter.write(jsonSubdivPath, JSON.stringify(subdivisions));
                }

                new Notice('The three JSON files have been written.');
            });
    }
}
