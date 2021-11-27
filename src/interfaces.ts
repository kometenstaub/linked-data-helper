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
    "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority"?:    Id[];
    "http://www.loc.gov/mads/rdf/v1#hasNarrowerExternalAuthority"?: Id[];
    "skos:altLabel"?:                                               LanguageAndValue;
    "skos:broader"?:                                                Id[] | Id;
    "skos:changeNote"?:                                             Id[];
    "skos:editorial"?:                                              string;
    "skos:inScheme"?:                                               Id;
    "skos:narrower"?:                                               Id[] | Id;
    "skos:note"?:                                                   string | string[];
    "skos:related"?:                                                Id[] | Id;
    "skosxl:altLabel"?:                                             Id;
    "cs:changeReason"?:                                             string;
    "cs:createdDate"?:                                              CSCreatedDate;
    "cs:creatorName"?:                                              Id;
    "cs:subjectOfChange"?:                                          Id;
    "skosxl:literalForm"?:                                          LanguageAndValue;

    "madsrdf:classification"?:                                      Id;
}

// prettier-ignore
export interface SkolemGraphNode extends Graph {
    "@id":                                                         string;
    "madsrdf:code":                                                string;
}

// prettier-ignore
interface CSCreatedDate {
    "@type":  string;
    "@value": Date;
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

