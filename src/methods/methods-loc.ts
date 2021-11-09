import { App, FileSystemAdapter, normalizePath, Notice } from 'obsidian';
import type LinkedDataHelperPlugin from '../main';
import type { Graph, headings, LcshInterface } from '../interfaces';
import { createReadStream } from 'fs';
import split2 from 'split2';

export class SkosMethods {
    app: App;
    plugin: LinkedDataHelperPlugin;

    constructor(app: App, plugin: LinkedDataHelperPlugin) {
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
        return normalizePath(attachmentPath);
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
                    let lcc: string = '';

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
                    if (element['madsrdf:classification']) {
                        const skolemIri: string =
                            element['madsrdf:classification']['@id'];
                        for (let againElement of obj['@graph']) {
                            if (againElement['@id'] === skolemIri) {
                                //@ts-ignore
                                lcc = againElement['madsrdf:code'];
                                break;
                            }
                        }
                    }
                    //@ts-expect-error
                    const endUri: string = uri.split('/').last();
                    Object.assign(jsonUriToPrefLabel, {
                        [endUri]: prefLabel,
                    });
                    if (element['skos:altLabel']?.['@language'] === 'en') {
                        altLabel = element['skos:altLabel']['@value'];
                    }
                    const graph = obj['@graph'];
                    broaderURLs = this.pushHeadings(element, graph, 'broader');
                    narrowerURLs = this.pushHeadings(
                        element,
                        graph,
                        'narrower'
                    );
                    relatedURLs = this.pushHeadings(element, graph, 'related');
                    currentObj = this.onlyReturnFull(
                        prefLabel,
                        altLabel,
                        uri,
                        broaderURLs,
                        narrowerURLs,
                        relatedURLs,
                        lcc
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

    private onlyReturnFull(
        prefLabel: string,
        altLabel: string,
        uri: string,
        broaderURLs: string[],
        narrowerURLs: string[],
        relatedURLs: string[],
        lcc: string
    ): headings {
        //@ts-ignore
        let currentObj: headings = {};
        let reducedBroaderURLs: string[] = [];
        for (let url of broaderURLs) {
            if (url && url.includes('/')) {
                //@ts-expect-error
                reducedBroaderURLs.push(url.split('/').last());
            } else {
                reducedBroaderURLs.push(url);
            }
        }
        let reducedNarrowerURLs: string[] = [];
        for (let url of narrowerURLs) {
            if (url && url.includes('/')) {
                //@ts-expect-error
                reducedNarrowerURLs.push(url.split('/').last());
            } else {
                reducedNarrowerURLs.push(url);
            }
        }
        let reducedRelatedURLs: string[] = [];
        for (let url of relatedURLs) {
            if (url && url.includes('/')) {
                //@ts-expect-error
                reducedRelatedURLs.push(url.split('/').last());
            } else {
                reducedRelatedURLs.push(url);
            }
        }

        //@ts-expect-error
        let reducedUri: string = uri.split('/').last();
        currentObj.pL = prefLabel;
        currentObj.uri = reducedUri;
        if (altLabel !== '') {
            currentObj.aL = altLabel;
        }
        if (broaderURLs.length > 0) {
            currentObj.bt = reducedBroaderURLs;
        }
        if (narrowerURLs.length > 0) {
            currentObj.nt = reducedNarrowerURLs;
        }
        if (relatedURLs.length > 0) {
            currentObj.rt = reducedRelatedURLs;
        }
        if (lcc !== '') {
            currentObj.lcc = lcc;
        }

        return currentObj;
    }

    private pushHeadings(
        element: Graph,
        graph: Graph[],
        type: string
    ): string[] {
        let urls = [];
        const headingType: string = `skos:${type}`;
        //@ts-ignore
        if (element[headingType]) {
            //@ts-ignore
            if (Array.isArray(element[headingType])) {
                //@ts-ignore
                for (let subElement of element[headingType]) {
                    const id = subElement['@id'];
                    if (id.startsWith('_:')) {
                        const term = getSkolemIriRelation(graph, id);
                        urls.push(term);
                    } else {
                        urls.push(id);
                    }
                }
            } else {
                //@ts-ignore
                const id: string = element[headingType]['@id'];
                if (id.startsWith('_:')) {
                    const term = getSkolemIriRelation(graph, id);
                    urls.push(term);
                } else {
                    //@ts-ignore
                    urls.push(id);
                }
            }
        }

        return urls;
    }
}

/**
 *
 * @param graph
 * @param id
 * @returns - it always returns a non-empty string, because this function is only called if there is a matching result
 */
function getSkolemIriRelation(graph: Graph[], id: string): string {
    let term: string = '';
    for (let part of graph) {
        if (part['@id'] === id) {
            //@ts-ignore
            // prettier-ignore
            if (part['skos:prefLabel']['@language'] === 'en') {
                term = part['skos:prefLabel']['@value'];
                break;
            }
        }
    }
    return term;
}
