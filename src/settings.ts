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
			text: 'Linked Data Vocabularies Helper Plugin Settings',
		});

		containerEl.createEl('h3', {
			text: 'Settings for Library of Congress Linked Data',
		});

	}
}
