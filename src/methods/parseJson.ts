import type {
    Graph,
    headings,
    LcshInterface,
    SkolemGraphNode,
    uriToHeading,
} from '../interfaces';

import type {BROADER, NARROWER, RELATED} from "../constants";

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
        let altLabels: string[] = [];
        let lcc = '';

        let uri = '';
        if (element['madsrdf:authoritativeLabel']?.['@language'] === 'en') {
            uri = element['@id'];
            const currentPrefLabel = element['madsrdf:authoritativeLabel']['@value'];
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
        const endUri = splitUri(uri);
        Object.assign(jsonUriToPrefLabel, {
            [endUri]: prefLabel,
        });
        const graph = obj['@graph'];
        // there can be multiple altLabels
        altLabels = makeArrayAndResolveSkolemIrisAltLabel(element, graph)
        broaderURLs = makeArrayAndResolveSkolemIris(element, graph, 'hasBroaderAuthority');
        // prettier-ignore
        narrowerURLs = makeArrayAndResolveSkolemIris(element, graph, 'hasNarrowerAuthority');
        relatedURLs = makeArrayAndResolveSkolemIris(element, graph, 'hasReciprocalAuthority');
        currentObj = onlyReturnFull(
            prefLabel,
            altLabels,
            uri,
            broaderURLs,
            narrowerURLs,
            relatedURLs,
            lcc
        );
        if (element['madsrdf:note']) {
            let note = element['madsrdf:note'];
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
    return splitUrl[splitUrl.length - 1];
}

function reduceUrls(
    broaderURLs: string[],
    narrowerURLs: string[],
    relatedURLs: string[]
) {
    const reducedBroaderURLs: string[] = [];
    const reducedNarrowerURLs: string[] = [];
    const reducedRelatedURLs: string[] = [];
    const intermediateObj = {
        broader: [reducedBroaderURLs, broaderURLs],
        narrower: [reducedNarrowerURLs, narrowerURLs],
        related: [reducedRelatedURLs, relatedURLs],
    };

    // populate the reduced URL arrays with the end of the URLs
    for (const value of Object.values(intermediateObj)) {
        for (const url of value[1]) {
            // normal URI
            if (url && url.includes('/')) {
                const endUri = splitUri(url);
                value[0].push(endUri);
            } else {
                // heading name because of Skolem IRI
                value[0].push(url);
            }
        }
    }
    return { reducedBroaderURLs, reducedNarrowerURLs, reducedRelatedURLs };
}

/**
 * Returns only the properties that are present
 * and only uses the ID instead of the full URI for the uri property
 */
function onlyReturnFull(
    prefLabel: string,
    altLabel: string[],
    uri: string,
    broaderURLs: string[],
    narrowerURLs: string[],
    relatedURLs: string[],
    lcc: string
): headings {
    //@ts-expect-error, The object needs to be initialised,
    // it is populated later on and is what will be returned by the function
    const currentObj: headings = {};
    const { reducedBroaderURLs, reducedNarrowerURLs, reducedRelatedURLs } =
        reduceUrls(broaderURLs, narrowerURLs, relatedURLs);

    currentObj.pL = prefLabel;
    currentObj.uri = splitUri(uri);
    if (altLabel.length > 0) {
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

/**
 * Gets the URIs (or name, in case of Skolem IRIs) of the relation headings.
 * @param element - The current node
 * @param graph - The full graph with all the nodes
 * @param type - The current relation type
 * @returns The full (unreduced) URIs of the relation headings
 *
 * @remarks - It turns individual headings into an Array and resolves Skolem IRIs.
 *
 */
function makeArrayAndResolveSkolemIris(
    element: Graph,
    graph: Graph[],
    type: 'hasBroaderAuthority' | 'hasNarrowerAuthority' | 'hasReciprocalAuthority'
): string[] {
    const urls = [];
    const headingType:
        | BROADER
        | NARROWER
        | RELATED = `madsrdf:${type}`;
    const relation = element[headingType];
    if (relation !== undefined) {
        if (Array.isArray(relation)) {
            for (const subElement of relation) {
                const id = subElement['@id'];
                if (id.startsWith('_:')) {
                    const term = getHeadingForSkolemIri(graph, id);
                    urls.push(term);
                } else {
                    urls.push(id);
                }
            }
        } else {
            const id: string = relation['@id'];
            if (id.startsWith('_:')) {
                const term = getHeadingForSkolemIri(graph, id);
                urls.push(term);
            } else {
                urls.push(id);
            }
        }
    }

    return urls;
}

/**
 * Gets the URIs (or name, in case of Skolem IRIs) of the altLabels
 * @param element - The current node
 * @param graph - The full graph with all the nodes
 * @returns The full (unreduced) URIs of the relation headings
 *
 * @remarks - It turns individual headings into an Array and resolves Skolem IRIs.
 *
 */
function makeArrayAndResolveSkolemIrisAltLabel(
    element: Graph,
    graph: Graph[],
): string[] {
    const urls = [];
    const labels = element['madsrdf:hasVariant'];
    if (labels !== undefined) {
        if (Array.isArray(labels)) {
            for (const subElement of labels) {
                if (subElement['@language'] === 'en') {
                    const value = subElement['@value'];
                    // TODO: check if they can have skolemIRIs
                    if (value.startsWith('_:')) {
                        const term = getHeadingForSkolemIri(graph, value);
                        urls.push(term);
                    } else {
                        urls.push(value);
                    }
                }
            }
        } else {
            if (labels['@language'] === 'en') {
                const value: string = labels['@value'];
                if (value.startsWith('_:')) {
                    const term = getHeadingForSkolemIri(graph, value);
                    urls.push(term);
                } else {
                    urls.push(value);
                }
            }
        }
    }

    return urls;
}
/**
 * Resolves the heading to the given Skolem IRI
 * @param graph - All nodes of the graph
 * @param id - The Skolem IRI that maps to an ID on a node on {@param graph}
 * @returns - It always returns a non-empty string, because this function is only called if there is a matching result
 */
function getHeadingForSkolemIri(graph: Graph[], id: string): string {
    let term = '';
    for (const part of graph) {
        if (part['@id'] === id) {
            const prefLabel = part['madsrdf:authoritativeLabel'];
            if (prefLabel['@language'] === 'en') {
                term = prefLabel['@value'];
                break;
            }
        }
    }
    return term;
}