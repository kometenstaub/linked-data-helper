import { App, FileSystemAdapter, Notice } from 'obsidian';
import type LinkeDataHelperPlugin from '../main';
import type {
    Graph,
    headings,
    LcshInterface,
    linksToPrefLabel,
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
        let jsonPrefLabel: prefLabelToRelations[] = [];
        let jsonUriToPrefLabel = {}
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
                        Object.assign(jsonUriToPrefLabel, {[uri]: prefLabel})
                        if (element['skos:altLabel']?.['@language'] === 'en') {
                            altLabel = element['skos:altLabel']['@value'];
                        }
                        broaderURLs = this.pushHeadings(element, 'broader');
                        narrowerURLs = this.pushHeadings(element, 'narrower');
                        relatedURLs = this.pushHeadings(element, 'related');
                        currentObj[prefLabel] = {
                            altLabel: altLabel,
                            broader: broaderURLs,
                            narrower: narrowerURLs,
                            related: relatedURLs,
                        };
                        jsonPrefLabel.push(currentObj);
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

    //	/**
    //	 *
    //	 * @param responseObject - passed from {@link SKOSModal.async onChooseSuggestion}, is
    //	 * what {@link SkosMethods.async getURL} returns
    //	 * @returns - the headingObj of type {@link headings} which contains the broader, narrower and related headings
    //	 * which can then be written to the file with {@link SkosMethods.writeYaml}
    //	 */
    //	public async parseSKOS(
    //		json: LcshInterface
    //	) {
    //		let broaderURLs: string[] = [];
    //		let narrowerURLs: string[] = [];
    //		let relatedURLs: string[] = [];
    //
    //		/**
    //		 * The broader, narrower and related URLs are all in one object in the array, therefore
    //		 * I can break after the last one and don't check the objects after it because no BT/NT/RT links
    //		 * would be in there; hence also three `if` and not else if (they're all in the same object)
    //		 */
    //		// prettier-ignore
    //		for (let element of responseObject) {
    //			//@ts-ignore
    //			let broaderItem: HTTPIDLOCGovOntologiesRecordInfoLanguageOfCataloging[] = element[BROADER_URL];
    //			//@ts-ignore
    //			let narrowerItem: HTTPIDLOCGovOntologiesRecordInfoLanguageOfCataloging[] = element[NARROWER_URL];
    //			//@ts-ignore
    //			let relatedItem: HTTPIDLOCGovOntologiesRecordInfoLanguageOfCataloging[] = element[RELATED_URL];
    //			if (broaderItem) {
    //				for (let element of broaderItem) {
    //					broaderURLs.push(element['@id']);
    //				}
    //			} if (narrowerItem) {
    //				for (let element of narrowerItem) {
    //					narrowerURLs.push(element['@id']);
    //				}
    //			} if (relatedItem) {
    //				for (let element of relatedItem) {
    //					relatedURLs.push(element['@id']);
    //				}
    //				break;
    //			}
    //		}
    //
    //		let broaderHeadings: string[] = [];
    //		let narrowerHeadings: string[] = [];
    //		let relatedHeadings: string[] = [];
    //
    //		/**
    //		 * Each JSON for each heading URL is requested and its name is resolved and added to the headingsArr
    //		 * @param urls - the URL arrays from above, @see broaderURLs, @see narrowerURLs, @see relatedURLs
    //		 * @param headingsArr - the array to be filled with values, @see broaderHeadings, @see narrowerHeadings, @see relatedHeadings
    //		 * @param numberOfHeadings - the number of maximum headings to be included, they are taken from the settings
    //		 */
    //		const fillValues = async (
    //			urls: string[],
    //			headingsArr: string[],
    //			numberOfHeadings: string
    //		) => {
    //			let count: number = 0;
    //			if (parseInt(numberOfHeadings) > 3 || numberOfHeadings === '') {
    //				count = 3;
    //			} else {
    //				count = parseInt(numberOfHeadings);
    //			}
    //			for (let url of urls) {
    //				if (count === 0) {
    //					break;
    //				}
    //				responseObject = await this.requestHeadingURL(url + '.json');
    //
    //				for (let element of responseObject) {
    //					if (element['@id'] === url) {
    //						let subelement = element[PREF_LABEL];
    //						if (subelement !== undefined) {
    //							for (let subsubelement of subelement) {
    //								if (subsubelement['@language'] === 'en') {
    //									headingsArr.push(subsubelement['@value']);
    //								}
    //								count--;
    //							}
    //						}
    //						// we already have the heading name, no need to check the other objects
    //						break;
    //					}
    //				}
    //			}
    //		};
    //
    //		await fillValues(
    //			broaderURLs,
    //			broaderHeadings,
    //			this.plugin.settings.broaderMax
    //		);
    //		await fillValues(
    //			narrowerURLs,
    //			narrowerHeadings,
    //			this.plugin.settings.narrowerMax
    //		);
    //		await fillValues(
    //			relatedURLs,
    //			relatedHeadings,
    //			this.plugin.settings.relatedMax
    //		);
    //
    //		const headingObj: headings = {
    //			broader: broaderHeadings,
    //			narrower: narrowerHeadings,
    //			related: relatedHeadings,
    //		};
    //
    //		//return headingObj;
    //	}
    //}
}
//
