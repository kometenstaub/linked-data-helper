export interface LiDaHeSettings {
    lcshInputPath: string;
    lcshOutputPath: string;
}

// export interface prefLabelToRelations {
//     [prefLabel: string ] : headings
// }

export interface headings {
    pL: string;
    uri: string;
    aL?: string; //altLabel
    bt?: string[]; //broader
    nt?: string[]; // narrower
    rt?: string[]; //related
    note?: string;
    lcc?: string;
}

declare module 'obsidian' {
    interface App {
        commands: {
            addCommand: any;
            removeCommand: any;
        };
        settings: LiDaHeSettings;
    }
    interface Vault {
        getAvailablePathForAttachments: (
            fileName: string,
            extension?: string,
            currentFile?: TFile
        ) => Promise<string>;
        config: {
            attachmentFolderPath: string;
        };
    }
}


/**
 * If a relation has a skolem IRI, then it points to an element of the {@link Graph} which
 * contains a key like this interface
 */
export interface relationsPrefLabel {
    "skos:prefLabel": {
        "@language": string; // needs to be '@en' to be the right match
        "@value": string;
    }
}



// prettier-ignore
export interface LcshInterface {
    "@context": Context;
    "@graph":   Graph[];
}

// prettier-ignore
export interface Context {
    cs:     string;
    rdf:    string;
    rdfs:   string;
    rdfs1:  string;
    skos:   string;
    skosxl: string;
    xsd:    string;
    about:  string;
}

// prettier-ignore
export interface Graph {
    "@id":                                                          string;
    "http://www.loc.gov/mads/rdf/v1#authoritativeLabel"?:           string;
    "@type":                                                        string;
    "skos:prefLabel":                                               Skos;
    "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority"?:    CSCreatorName[];
    "http://www.loc.gov/mads/rdf/v1#hasNarrowerExternalAuthority"?: CSCreatorName[];
    "skos:altLabel"?:                                               Skos;
    "skos:broader"?:                                                CSCreatorName[] | CSCreatorName;
    "skos:changeNote"?:                                             CSCreatorName[];
    "skos:editorial"?:                                              string;
    "skos:inScheme"?:                                               CSCreatorName;
    "skos:narrower"?:                                               CSCreatorName[] | CSCreatorName;
    "skos:note"?:                                                   string | string[];
    "skos:related"?:                                                CSCreatorName[] | CSCreatorName;
    "skosxl:altLabel"?:                                             CSCreatorName;
    "cs:changeReason"?:                                             string;
    "cs:createdDate"?:                                              CSCreatedDate;
    "cs:creatorName"?:                                              CSCreatorName;
    "cs:subjectOfChange"?:                                          CSCreatorName;
    "skosxl:literalForm"?:                                          Skos;

    "madsrdf:classification"?:                                      CSCreatorName;
}

// prettier-ignore
export interface CSCreatedDate {
    "@type":  string;
    "@value": Date;
}

// prettier-ignore
export interface CSCreatorName {
    "@id": string;
}

// prettier-ignore
export interface Skos {
    "@language": Language;
    "@value":    string;
}

// prettier-ignore
export enum Language {
    En = "en",
}
