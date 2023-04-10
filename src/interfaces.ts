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

export interface uriToHeading {
    [key: string]: string;
}

// prettier-ignore
export interface LcshInterface {
    "@context": "http://v3/authorities/subjects/context.json";
    "@graph":   Graph[];
    // "/authorities/subjects/sh00000023"
    "@id":   string;
}

// prettier-ignore
export interface Graph {
    // "http://id.loc.gov/authorities/subjects/sh00000023"
    "@id":                                                          string;
    "madsrdf:authoritativeLabel":                                   LanguageAndValue;
    "madsrdf:hasVariant"?:                                          LanguageAndValue | LanguageAndValue[];
    "madsrdf:hasBroaderAuthority"?:                                 Id[] | Id;
    "madsrdf:hasReciprocalAuthority"?:                              Id[] | Id;
    "madsrdf:hasNarrowerAuthority"?:                                Id[] | Id;
    "madsrdf:note"?:                                                string | string[];
    "madsrdf:classification"?:                                      Id;
}

// prettier-ignore
export interface SkolemGraphNode extends Graph {
    "@id":                                                         string;
    "madsrdf:code":                                                string;
}


// prettier-ignore
interface Id {
    "@id": string;
}

// prettier-ignore
interface LanguageAndValue {
    "@language": Language;
    "@value":    string;
}

// prettier-ignore
enum Language {
    En = "en",
}
