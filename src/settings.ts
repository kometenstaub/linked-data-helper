import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type LinkedDataHelperPlugin from './main';

export default class LiDaHeSettingsTab extends PluginSettingTab {
    plugin: LinkedDataHelperPlugin;

    constructor(app: App, plugin: LinkedDataHelperPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        const { settings } = this.plugin;

        containerEl.empty();

        containerEl.createEl('h2', {
            text: 'Linked Data Helper Settings',
        });

        containerEl.createEl('h3', {
            text: 'Settings for Library of Congress Linked Data',
        });

        containerEl.createEl('h4', {
            text: 'LCSH Settings',
        });

        const linkDiv = containerEl.createDiv();

        linkDiv.appendChild(
            createFragment((frag) => {
                frag.appendText('Please download the ');
                frag.createEl('em', {
                    text: 'LC Subject Headings (LCSH) (MADS/RDF and SKOS/RDF)',
                });
                frag.appendText(' file (in ');
                frag.createEl('em', {
                    text: 'ndjson',
                });
                frag.appendText(' format) from ');
                frag.createEl(
                    'a',
                    {
                        text: 'here',
                        href: 'https://id.loc.gov/download/',
                    },
                    (a) => {
                        a.setAttr('target', '_blank');
                    }
                );
                frag.appendText(
                    ' and unzip it. (The file name may be a bit different, since the file also gets updated from time to time.) \
                    The unzipped file will be ~2.5GB, therefore it is a good idea to save and unzip it outside of the vault.'
                );
            })
        );

        containerEl.createEl('br');

        new Setting(containerEl)
            .setName('Path of the extracted zip file')
            .setDesc('Please input the absolute path to the extracted file.')
            .addText((text) =>
                text
                    .setPlaceholder('/home/user/Downloads/lcsh.skos.ndjson')
                    .setValue(this.plugin.settings.lcshInputPath)
                    .onChange(async (value) => {
                        this.plugin.settings.lcshInputPath = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName(
                'Folder where the three generated JSON files should be saved'
            )
            .setDesc(
                createFragment((frag) => {
                    frag.appendText(
                        "Leave empty to save the files automatically in the subfolder 'linked-data-vocabularies' in your attachments folder."
                    );
                    frag.createEl('br');
                    frag.createEl('b', { text: 'Note: ' });
                    frag.appendText(
                        'This will only work when your attachment folder is your vault (default) or when it is a specific folder.'
                    );
                    frag.createEl('br');
                    frag.appendText(
                        'The path must start from your vault root.'
                    );
                    //frag.appendChild(bolded)
                    //const not = createEl('em', {text: 'not'})
                    //bolded.appendChild(not)
                    //bolded.appendText(' work if you have selected ')
                    //bolded.appendChild(createEl('em', {text: '"Same folder as current file."'}))
                    frag.createEl('br');

                    try {
                        if (
                            this.app.vault.config.attachmentFolderPath.startsWith(
                                './'
                            )
                        ) {
                            frag.createEl('b', {
                                text: 'In your case, you need to specify in which folder the files shall be saved.',
                            });
                        } else {
                            frag.appendText(
                                "In your case, you don't need to input a path."
                            );
                        }
                    } catch {
                        // catch error
                        new Notice(
                            'Please check your attachments setting under Files & Links.'
                        );
                    }
                })
            )
            .addText((text) =>
                text
                    .setPlaceholder('')
                    .setValue(this.plugin.settings.lcshOutputPath)
                    .onChange(async (value) => {
                        this.plugin.settings.lcshOutputPath = value.trim(); //normalizePath(
                        //);
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Perform the conversion')
            .setDesc(
                'When clicked, it will generate the three JSON files that the \
			Linked Data Vocabularies plugin needs to work with LCSH.'
            )
            .addButton((button) => {
                button
                    .setCta()
                    .setTooltip('Click to start the conversion.')
                    .setButtonText('Start conversion')
                    .onClick(() => {
                        if (this.plugin.settings.lcshInputPath !== '') {
                            new Notice('The conversion will start now. This may take some time. You will be notified when it is done.');
                            if (this.plugin.settings.lcshOutputPath !== '') {
                                this.plugin.methods_loc.convertLcshSkosNdjson(
                                    this.plugin.settings.lcshOutputPath
                                );
                            } else {
                                this.plugin.methods_loc.convertLcshSkosNdjson();
                            }
                        }
                    });
            });
    }
}
