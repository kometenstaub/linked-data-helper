import type {Graph} from "../interfaces";

/**
 *
 * @param graph
 * @param id
 * @returns - it always returns a non-empty string, because this function is only called if there is a matching result
 */
export function getSkolemIriRelation(graph: Graph[], id: string): string {
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