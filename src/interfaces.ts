export interface LiDaHeSettings {
    lcshInputPath: string;
    lcshOutputPath: string;
}


export interface headings {
    pL: string; // prefLabel
    uri: string;
    aL?: string; // altLabel
    bt?: string[]; // broader
    nt?: string[]; // narrower
    rt?: string[]; // related
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
    "skos:prefLabel":                                               LanguageAndValue;
    "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority"?:    id[];
    "http://www.loc.gov/mads/rdf/v1#hasNarrowerExternalAuthority"?: id[];
    "skos:altLabel"?:                                               LanguageAndValue;
    "skos:broader"?:                                                id[] | id;
    "skos:changeNote"?:                                             id[];
    "skos:editorial"?:                                              string;
    "skos:inScheme"?:                                               id;
    "skos:narrower"?:                                               id[] | id;
    "skos:note"?:                                                   string | string[];
    "skos:related"?:                                                id[] | id;
    "skosxl:altLabel"?:                                             id;
    "cs:changeReason"?:                                             string;
    "cs:createdDate"?:                                              CSCreatedDate;
    "cs:creatorName"?:                                              id;
    "cs:subjectOfChange"?:                                          id;
    "skosxl:literalForm"?:                                          LanguageAndValue;

    "madsrdf:classification"?:                                      id;
}

// prettier-ignore
export interface CSCreatedDate {
    "@type":  string;
    "@value": Date;
}

// prettier-ignore
export interface id {
    "@id": string;
}

// prettier-ignore
export interface LanguageAndValue {
    "@language": Language;
    "@value":    string;
}

// prettier-ignore
export enum Language {
    En = "en",
}
