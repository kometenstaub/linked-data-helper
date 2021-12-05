import type {Graph, headings, LcshInterface, SkolemGraphNode, uriToHeading,} from '../interfaces';


export function parseJsonHeading(
    obj: LcshInterface,
    jsonPrefLabel: headings[],
    subdivisions: headings[],
    jsonUriToPrefLabel: uriToHeading
) {
    //@ts-expect-error, it needs to be initialised
    // and will be populated later on
    let currentObj: headings = {};
    const id = obj['@context'].about;
    for (const element of obj['@graph']) {
        let broaderURLs: string[] = [];
        let narrowerURLs: string[] = [];
        let relatedURLs: string[] = [];
        let prefLabel = '';
        let altLabel = '';
        let lcc = '';

        let uri = '';
        if (element['skos:prefLabel']?.['@language'] === 'en') {
            uri = element['@id'];
            const currentPrefLabel = element['skos:prefLabel']['@value'];
            if (uri === id) {
                prefLabel = currentPrefLabel;
            } else {
                continue;
            }
        } else {
            continue;
        }
        if (element['madsrdf:classification']) {
            const skolemIri: string = element['madsrdf:classification']['@id'];
            for (const againElement of obj['@graph']) {
                if (againElement['@id'] === skolemIri) {
                    const skolemNode = againElement as SkolemGraphNode;
                    lcc = skolemNode['madsrdf:code'];
                    break;
                }
            }
        }
        const splitUri: string[] = uri.split('/');
        const endUri = splitUri[splitUri.length - 1];
        Object.assign(jsonUriToPrefLabel, {
            [endUri]: prefLabel,
        });
        if (element['skos:altLabel']?.['@language'] === 'en') {
            altLabel = element['skos:altLabel']['@value'];
        }
        const graph = obj['@graph'];
        broaderURLs = pushHeadings(element, graph, 'broader');
        narrowerURLs = pushHeadings(element, graph, 'narrower');
        relatedURLs = pushHeadings(element, graph, 'related');
        currentObj = onlyReturnFull(
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
                for (const el of note) {
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
        break;
    }
}

function splitUri(url: string): string {
    const splitUrl = url.split('/');
    return splitUrl[splitUrl.length - 1]
}


function onlyReturnFull(
    prefLabel: string,
    altLabel: string,
    uri: string,
    broaderURLs: string[],
    narrowerURLs: string[],
    relatedURLs: string[],
    lcc: string
): headings {
    //@ts-expect-error, the object needs to be initialised,
    // it is populated later on
    const currentObj: headings = {};
    const reducedBroaderURLs: string[] = [];
    for (const url of broaderURLs) {
        if (url && url.includes('/')) {
            const endUri = splitUri(url)
            reducedBroaderURLs.push(endUri);
        } else {
            reducedBroaderURLs.push(url);
        }
    }
    const reducedNarrowerURLs: string[] = [];
    for (const url of narrowerURLs) {
        if (url && url.includes('/')) {
            const endUri = splitUri(url)
            reducedNarrowerURLs.push(endUri);
        } else {
            reducedNarrowerURLs.push(url);
        }
    }
    const reducedRelatedURLs: string[] = [];
    for (const url of relatedURLs) {
        if (url && url.includes('/')) {
            const endUri = splitUri(url)
            reducedRelatedURLs.push(endUri);
        } else {
            reducedRelatedURLs.push(url);
        }
    }

    const reducedUri: string = splitUri(uri)
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

function pushHeadings(
    element: Graph,
    graph: Graph[],
    type: 'broader' | 'narrower' | 'related'
): string[] {
    const urls = [];
    const headingType:
        | 'skos:broader'
        | 'skos:narrower'
        | 'skos:related' = `skos:${type}`;
    const relation = element[headingType];
    if (relation !== undefined) {
        if (Array.isArray(relation)) {
            for (const subElement of relation) {
                const id = subElement['@id'];
                if (id.startsWith('_:')) {
                    const term = getSkolemIriRelation(graph, id);
                    urls.push(term);
                } else {
                    urls.push(id);
                }
            }
        } else {
            const id: string = relation['@id'];
            if (id.startsWith('_:')) {
                const term = getSkolemIriRelation(graph, id);
                urls.push(term);
            } else {
                urls.push(id);
            }
        }
    }

    return urls;
}

/**
 *
 * @param graph
 * @param id
 * @returns - it always returns a non-empty string, because this function is only called if there is a matching result
 */
function getSkolemIriRelation(graph: Graph[], id: string): string {
    let term = '';
    for (const part of graph) {
        if (part['@id'] === id) {
            const prefLabel = part['skos:prefLabel'];
            if (prefLabel['@language'] === 'en') {
                term = prefLabel['@value'];
                break;
            }
        }
    }
    return term;
}
