import { App, FileSystemAdapter, Notice } from 'obsidian';
import type LinkeDataHelperPlugin from '../main';
import type { Graph, headings, LcshInterface } from '../interfaces';
import { createReadStream, writeFileSync } from 'fs';
import { parse } from 'ndjson';

export class SkosMethods {
    app: App;
    plugin: LinkeDataHelperPlugin;

    constructor(app: App, plugin: LinkeDataHelperPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    getAbsolutePath(fileName: string): string {
        let basePath;
        let relativePath;
        // base path
        if (this.app.vault.adapter instanceof FileSystemAdapter) {
            basePath = this.app.vault.adapter.getBasePath();
        } else {
            throw new Error('Cannot determine base path.');
        }
        // relative path
        relativePath = `${this.app.vault.configDir}/plugins/linked-data-vocabularies/${fileName}`;
        // absolute path
        return `${basePath}/${relativePath}`;
    }

    /**
 * maybe I need to change the approach for the fuzzy suggester and do it like TfTHacker does in Wordnet
 * That would meand to have a structure like this:
 *[
        {
           "SearchTerm": "'hood",
           "Term": "'hood",
           "Definition": "(slang) a neighborhood  "
        },
        {
           "SearchTerm": ".22caliber",
           "Term": ".22_caliber",
           "Definition": "of or relating to the bore of a gun (or its ammunition) that measures twenty-two hundredths of a        n inch in diameter; \"a .22 caliber pistol\"  "
        },
        {
           "SearchTerm": ".38caliber",
           "Term": ".38_caliber",
           "Definition": "of or relating to the bore of a gun (or its ammunition) that measures thirty-eight hundredths of         an inch in diameter; \"a .38 caliber shell\"  "
        }
    ]
 */

    public convertLcshSkosNdjson(outputPath?: string) {
        let jsonPrefLabel: headings[] = [];
        let jsonUriToPrefLabel = {};
        const inputPath = this.plugin.settings.lcshInputPath;
        let newOutputPath = '';
        if (outputPath) {
            newOutputPath = outputPath;
        }
        createReadStream(inputPath)
            .pipe(parse())
            .on('data', (obj: LcshInterface) => {
                //@ts-ignore
                let currentObj: headings = {};
                for (let element of obj['@graph']) {
                    let broaderURLs: string[] = [];
                    let narrowerURLs: string[] = [];
                    let relatedURLs: string[] = [];
                    let prefLabel: string = '';
                    let altLabel: string = '';

                    if (
                        element['skos:inScheme']?.['@id'] ===
                        'http://id.loc.gov/authorities/subjects'
                    ) {
                        if (element['skos:prefLabel']['@language'] === 'en') {
                            prefLabel = element['skos:prefLabel']['@value'];
                        }
                        const uri: string = element['@id'];
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
                        jsonPrefLabel.push(currentObj);
                        //Object.assign(jsonPrefLabel, currentObj)
                        break;
                    }
                }
            })
            .on('end', () => {
                let jsonPrefPath = '';
                if (newOutputPath === '') {
                    jsonPrefPath = this.getAbsolutePath('lcshSuggester.json');
                } else {
                    jsonPrefPath = newOutputPath + 'lcshSuggester.json';
                }

                writeFileSync(jsonPrefPath, JSON.stringify(jsonPrefLabel));
                let jsonUriPath = '';
                if (newOutputPath === '') {
                    jsonUriPath = this.getAbsolutePath('uriToPrefLabel.json');
                } else {
                    jsonUriPath = newOutputPath + 'uriToPrefLabel.json';
                }
                writeFileSync(jsonUriPath, JSON.stringify(jsonUriToPrefLabel));
                new Notice('Both JSON files have been written.');
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
        //@ts-expect-error
        let reducedBroaderURLs: string[] = broaderURLs.map((url) => {
            return url.split('/').last();
        });
        //@ts-expect-error
        let reducedNarrowerURLs: string[] = narrowerURLs.map((url) => {
            return url.split('/').last();
        });
        //@ts-expect-error
        let reducedRelatedURLs: string[] = relatedURLs.map((url) => {
            return url.split('/').last();
        });
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
                    rt: narrowerURLs,
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
                    rt: narrowerURLs,
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
