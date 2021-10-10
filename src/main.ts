import { Command, Editor, MarkdownView, Plugin } from 'obsidian';
import LiDaHeSettingsTab from './settings';
import { SkosMethods } from './methods/methods-loc';
import type { LiDaHeSettings } from './interfaces';

const DEFAULT_SETTINGS: LiDaHeSettings = {
};


export default class LinkeDataHelperPlugin extends Plugin {
	methods_loc = new SkosMethods(this.app, this);
	settings!: LiDaHeSettings;


	async onload() {
		console.log('loading Linked Data Vocabularies plugin');

		await this.loadSettings();

		this.addSettingTab(new LiDaHeSettingsTab(this.app, this));
	}

	onunload() {
		console.log('unloading Linked Data Vocabularies plugin');
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
