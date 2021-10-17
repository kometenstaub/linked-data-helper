import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type LinkeDataHelperPlugin from './main';

export default class LiDaHeSettingsTab extends PluginSettingTab {
    plugin: LinkeDataHelperPlugin;

    constructor(app: App, plugin: LinkeDataHelperPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        const { settings } = this.plugin;

        containerEl.empty();

        containerEl.createEl('h2', {
            text: 'Linked Data Vocabularies Helper Settings',
        });

        containerEl.createEl('h3', {
            text: 'Settings for Library of Congress Linked Data',
        });

        containerEl.createEl('h4', {
            text: 'LCSH Settings',
        });

        const linkDiv = containerEl.createDiv()

        linkDiv.appendChild(
            createFragment((frag) => {
                frag.appendText(
                    'Please download the '
                );
                frag.createEl('em', {
                    text: 'LC Subject Headings (LCSH) (SKOS/RDF only)'
                })
                frag.appendText(' file (in ')
                frag.createEl('em', {
                    text: 'ndjson'
                })
                frag.appendText(' format) from ')
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
                frag.appendText(' and unzip it.');
            })
        );
        
        containerEl.createEl('br')

        new Setting(containerEl)
            .setName('Path of the extracted zip file')
            .setDesc(
                'Please input the absolute path of the file you extracted.'
            )
            .addText((text) =>
                text
                    .setPlaceholder('/home/user/Downloads/lcsh.skos.ndjson')
                    .setValue(this.plugin.settings.lcshInputPath)
                    .onChange(async (value) => {
                        this.plugin.settings.lcshInputPath = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Folder where the two generated files should be saved')
            .setDesc(
                'Leave empty to place them in the folder of the Linked Data Vocabularies plugin.\
				For that to work, this plugin already has to be installed.\
				Please make sure to include the trailing slash (MacOS/Linux) or backslash (Windows) if\
				you do change the output folder.'
            )
            .addText((text) =>
                text
                    .setPlaceholder('')
                    .setValue(this.plugin.settings.lcshOutputPath)
                    .onChange(async (value) => {
                        this.plugin.settings.lcshOutputPath = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Perform the conversion')
            .setDesc(
                'When clicked, it will generate the two JSON files that the \
			Linked Data Vocabularies plugin needs to work with LCSH.'
            )
            .addButton((button) => {
                button
                    .setCta()
                    .setTooltip('Click to start the conversion.')
                    .setButtonText('Start conversion')
                    .onClick(() => {
                        if (this.plugin.settings.lcshInputPath !== '') {
                            new Notice('The conversion will start now!');
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
