import { App, FileSystemAdapter, normalizePath, Notice } from 'obsidian';
import type LinkeDataHelperPlugin from '../main';
import type { Graph, headings, LcshInterface } from '../interfaces';
import { createReadStream, writeFileSync } from 'fs';
import { normalize } from 'path';
import split2 from 'split2';

export class SkosMethods {
    app: App;
    plugin: LinkeDataHelperPlugin;

    constructor(app: App, plugin: LinkeDataHelperPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    async getAbsolutePath(fileName: string): Promise<string> {
        let basePath;
        //let relativePath;
        // base path
        if (this.app.vault.adapter instanceof FileSystemAdapter) {
            basePath = this.app.vault.adapter.getBasePath();
        } else {
            throw new Error('Cannot determine base path.');
        }
        // relative path
        //relativePath = `${this.app.vault.configDir}/plugins/linked-data-vocabularies/${fileName}`;
        let attachmentPath =
            await this.app.vault.getAvailablePathForAttachments(
                fileName,
                'json'
            );
        // overwrite file
        attachmentPath = attachmentPath.replace(/(.+?)(?: 1)(\.json)/, '$1$2');
        // absolute path
        return normalize(`${basePath}/${attachmentPath}`);
    }

    public convertLcshSkosNdjson(outputPath?: string) {
        let jsonPrefLabel: headings[] = [];
        let subdivisions: headings[] = [];
        let jsonUriToPrefLabel = {};
        let inputPath = '';
        if (this.plugin.settings.lcshInputPath) {
            inputPath = this.plugin.settings.lcshInputPath;
        } else {
            const text =
                'Please specify an input path for LCSH in the settings.';
            new Notice(text);
            throw Error(text);
        }
        let newOutputPath = '';
        if (outputPath) {
            newOutputPath = outputPath;
        }
        createReadStream(inputPath)
            .pipe(split2(JSON.parse))
            .on('data', (obj: LcshInterface) => {
                //@ts-ignore
                let currentObj: headings = {};
                const id = obj['@context'].about;
                for (let element of obj['@graph']) {
                    let broaderURLs: string[] = [];
                    let narrowerURLs: string[] = [];
                    let relatedURLs: string[] = [];
                    let prefLabel: string = '';
                    let altLabel: string = '';

                    //if (
                    //    element['skos:inScheme']?.['@id'] ===
                    //    'http://id.loc.gov/authorities/subjects'
                    //) {
                    let uri = '';
                    if (element['skos:prefLabel']?.['@language'] === 'en') {
                        uri = element['@id'];
                        const currentPrefLabel =
                            element['skos:prefLabel']['@value'];
                        if (uri === id) {
                            prefLabel = currentPrefLabel;
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    }
                    //@ts-expect-error
                    const endUri: string = uri.split('/').last();
                    Object.assign(jsonUriToPrefLabel, {
                        [endUri]: prefLabel,
                    });
                    if (element['skos:altLabel']?.['@language'] === 'en') {
                        altLabel = element['skos:altLabel']['@value'];
                    }
                    broaderURLs = this.pushHeadings(element, 'broader');
                    narrowerURLs = this.pushHeadings(element, 'narrower');
                    relatedURLs = this.pushHeadings(element, 'related');
                    currentObj = this.onlyReturnFull(
                        prefLabel,
                        altLabel,
                        uri,
                        broaderURLs,
                        narrowerURLs,
                        relatedURLs
                    );
                    if (element['skos:note']) {
                        let note = element['skos:note'];
                        if (Array.isArray(note)) {
                            let newNote = '';
                            for (let el of note) {
                                newNote += el;
                            }
                            note = newNote;
                        }
                        currentObj.note = note;
                        if (note.includes('Use as a')) {
                            subdivisions.push(currentObj);
                        } else {
                            jsonPrefLabel.push(currentObj);
                        }
                        //} else if (element['skos:editorial']) {
                        //  let editorial = element['skos:editorial'];
                        //  if (Array.isArray(editorial)) {
                        //      let neweditorial = '';
                        //      for (let el of editorial) {
                        //          neweditorial += el;
                        //      }
                        //      editorial = neweditorial;
                        //  }
                        //  currentObj.note = editorial;
                        //  if (editorial.startsWith('subdivision')) {
                        //      subdivisions.push(currentObj)
                        //  } else {
                        //      jsonPrefLabel.push(currentObj)
                        //  }
                    } else {
                        jsonPrefLabel.push(currentObj);
                    }

                    //Object.assign(jsonPrefLabel, currentObj)
                    break;
                    //}
                }
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
                        jsonPrefPath = await this.getAbsolutePath(
                            'linked-data-vocabularies/lcshSuggester'
                        );
                        jsonUriPath = await this.getAbsolutePath(
                            'linked-data-vocabularies/lcshUriToPrefLabel'
                        );
                        jsonSubdivPath = await this.getAbsolutePath(
                            'linked-data-vocabularies/lcshSubdivSuggester'
                      );
                        writeFileSync(jsonPrefPath, JSON.stringify(jsonPrefLabel));
                        writeFileSync(jsonUriPath, JSON.stringify(jsonUriToPrefLabel));
                        writeFileSync(jsonSubdivPath, JSON.stringify(subdivisions));
                    })();
                } else {
                    jsonPrefPath = normalize(
                        newOutputPath + '/' + 'lcshSuggester.json'
                    );
                    jsonUriPath = normalize(
                        newOutputPath + '/' + 'lcshUriToPrefLabel.json'
                    );
                    jsonSubdivPath = normalize(
                        newOutputPath + '/' + 'lcshSubdivSuggester.json'
                    );
                    writeFileSync(jsonPrefPath, JSON.stringify(jsonPrefLabel));
                    // prettier-ignore
                    writeFileSync(jsonUriPath, JSON.stringify(jsonUriToPrefLabel));
                    writeFileSync(jsonSubdivPath, JSON.stringify(subdivisions));
                }

                new Notice('The three JSON files have been written.');
            });
    }

    private onlyReturnFull(
        prefLabel: string,
        altLabel: string,
        uri: string,
        broaderURLs: string[],
        narrowerURLs: string[],
        relatedURLs: string[]
    ): headings {
        //@ts-ignore
        let currentObj: headings = {};
        let reducedBroaderURLs: string[] = [];
        for (let url of broaderURLs) {
            //@ts-expect-error
            reducedBroaderURLs.push(url.split('/').last());
        }
        let reducedNarrowerURLs: string[] = [];
        for (let url of narrowerURLs) {
            //@ts-expect-error
            reducedNarrowerURLs.push(url.split('/').last());
        }
        let reducedRelatedURLs: string[] = [];
        for (let url of relatedURLs) {
            //@ts-expect-error
            reducedRelatedURLs.push(url.split('/').last());
        }

        //@ts-expect-error
        let reducedUri: string = uri.split('/').last();
        if (altLabel !== '') {
            if (broaderURLs.length > 0) {
                if (narrowerURLs.length > 0 && relatedURLs.length > 0) {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            aL: altLabel,
                            bt: reducedBroaderURLs,
                            nt: reducedNarrowerURLs,
                            rt: reducedRelatedURLs,
                        };
                    }
                } else if (narrowerURLs.length > 0) {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            aL: altLabel,
                            bt: reducedBroaderURLs,
                            nt: reducedNarrowerURLs,
                        };
                    }
                } else if (relatedURLs.length > 0) {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            aL: altLabel,
                            bt: reducedBroaderURLs,
                            rt: reducedRelatedURLs,
                        };
                    }
                } else {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            aL: altLabel,
                            bt: reducedBroaderURLs,
                        };
                    }
                }
            } else if (narrowerURLs.length > 0) {
                if (relatedURLs.length > 0) {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            aL: altLabel,
                            nt: reducedNarrowerURLs,
                            rt: reducedRelatedURLs,
                        };
                    }
                } else {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            aL: altLabel,
                            nt: reducedNarrowerURLs,
                        };
                    }
                }
            } else if (relatedURLs.length > 0) {
                currentObj = {
                    pL: prefLabel,
                    uri: reducedUri,
                    aL: altLabel,
                    rt: reducedRelatedURLs,
                };
            } else {
                currentObj = {
                    pL: prefLabel,
                    uri: reducedUri,
                    aL: altLabel,
                };
            }
        } else {
            if (broaderURLs.length > 0) {
                if (narrowerURLs.length > 0 && relatedURLs.length > 0) {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            bt: reducedBroaderURLs,
                            nt: reducedNarrowerURLs,
                            rt: reducedRelatedURLs,
                        };
                    }
                } else if (narrowerURLs.length > 0) {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            bt: reducedBroaderURLs,
                            nt: reducedNarrowerURLs,
                        };
                    }
                } else if (relatedURLs.length > 0) {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            bt: reducedBroaderURLs,
                            rt: reducedRelatedURLs,
                        };
                    }
                } else {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            bt: reducedBroaderURLs,
                        };
                    }
                }
            } else if (narrowerURLs.length > 0) {
                if (relatedURLs.length > 0) {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            nt: reducedNarrowerURLs,
                            rt: reducedRelatedURLs,
                        };
                    }
                } else {
                    {
                        currentObj = {
                            pL: prefLabel,
                            uri: reducedUri,
                            nt: reducedNarrowerURLs,
                        };
                    }
                }
            } else if (relatedURLs.length > 0) {
                currentObj = {
                    pL: prefLabel,
                    uri: reducedUri,
                    rt: reducedRelatedURLs,
                };
            } else {
                currentObj = {
                    pL: prefLabel,
                    uri: reducedUri,
                };
            }
        }
        return currentObj;
    }

    private pushHeadings(element: Graph, type: string): string[] {
        let urls = [];
        const headingType: string = `skos:${type}`;
        //@ts-ignore
        if (element[headingType]) {
            //@ts-ignore
            if (Array.isArray(element[headingType])) {
                //@ts-ignore
                for (let id of element[headingType]) {
                    urls.push(id['@id']);
                }
            } else {
                //@ts-ignore
                urls.push(element[headingType]['@id']);
            }
        }
        return urls;
    }
}
