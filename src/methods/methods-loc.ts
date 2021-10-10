import { App, FileSystemAdapter, Notice } from 'obsidian';
import type LinkeDataHelperPlugin from '../main';
import type {
    Graph,
    headings,
    LcshInterface,
    prefLabelToRelations,
} from '../interfaces';
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
        relativePath = `${this.app.vault.configDir}/plugins/linked-data-helper/${fileName}`;
        // absolute path
        return `${basePath}/${relativePath}`;
    }

    public readStream() {
        let jsonPrefLabel = {};
        let jsonUriToPrefLabel = {};
        const path = this.getAbsolutePath('lcsh.skos.ndjson');
        //this.pushHeadings = this.pushHeadings.bind(this)
        createReadStream(path)
            .pipe(parse())
            .on('data', (obj: LcshInterface) => {
                let currentObj: prefLabelToRelations = {};
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
                        Object.assign(jsonUriToPrefLabel, { [uri]: prefLabel });
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
                        Object.assign(jsonPrefLabel, currentObj)
                        break;
                    }
                }
            })
            .on('end', () => {
                const jsonPrefPath = this.getAbsolutePath(
                    'prefToRelations.json'
                );
                writeFileSync(jsonPrefPath, JSON.stringify(jsonPrefLabel));
                const jsonUriPath = this.getAbsolutePath('uriToPrefLabel.json');
                writeFileSync(jsonUriPath, JSON.stringify(jsonUriToPrefLabel));
                new Notice(
                    'Both JSON files have been written to the "linked-data-helper" plugin folder.'
                );
            });
    }

    private onlyReturnFull(
        prefLabel: string,
        altLabel: string,
        uri: string,
        broaderURLs: string[],
        narrowerURLs: string[],
        relatedURLs: string[]
    ): prefLabelToRelations {
        let currentObj: prefLabelToRelations = {};
        if (altLabel !== '') {
            if (broaderURLs.length > 0) {
                if (narrowerURLs.length > 0 && relatedURLs.length > 0) {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            altLabel: altLabel,
                            broader: broaderURLs,
                            narrower: narrowerURLs,
                            related: relatedURLs,
                        };
                    }
                } else if (narrowerURLs.length > 0) {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            altLabel: altLabel,
                            broader: broaderURLs,
                            narrower: narrowerURLs,
                        };
                    }
                } else if (relatedURLs.length > 0) {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            altLabel: altLabel,
                            broader: broaderURLs,
                            related: relatedURLs,
                        };
                    }
                } else {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            altLabel: altLabel,
                            broader: broaderURLs,
                        };
                    }
                }
            } else if (narrowerURLs.length > 0) {
                if (relatedURLs.length > 0) {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            altLabel: altLabel,
                            narrower: narrowerURLs,
                            related: relatedURLs,
                        };
                    }
                } else {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            altLabel: altLabel,
                            narrower: narrowerURLs,
                        };
                    }
                }
            } else if (relatedURLs.length > 0) {
                currentObj[prefLabel] = {
                    uri: uri,
                    altLabel: altLabel,
                    related: narrowerURLs,
                };
            } else {
                currentObj[prefLabel] = {
                    uri: uri,
                    altLabel: altLabel,
                };
            }
        } else {
            if (broaderURLs.length > 0) {
                if (narrowerURLs.length > 0 && relatedURLs.length > 0) {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            broader: broaderURLs,
                            narrower: narrowerURLs,
                            related: relatedURLs,
                        };
                    }
                } else if (narrowerURLs.length > 0) {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            broader: broaderURLs,
                            narrower: narrowerURLs,
                        };
                    }
                } else if (relatedURLs.length > 0) {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            broader: broaderURLs,
                            related: relatedURLs,
                        };
                    }
                } else {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            broader: broaderURLs,
                        };
                    }
                }
            } else if (narrowerURLs.length > 0) {
                if (relatedURLs.length > 0) {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            narrower: narrowerURLs,
                            related: relatedURLs,
                        };
                    }
                } else {
                    {
                        currentObj[prefLabel] = {
                            uri: uri,
                            narrower: narrowerURLs,
                        };
                    }
                }
            } else if (relatedURLs.length > 0) {
                currentObj[prefLabel] = {
                    uri: uri,
                    related: narrowerURLs,
                };
            } else {
                currentObj[prefLabel] = {
                    uri: uri,
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