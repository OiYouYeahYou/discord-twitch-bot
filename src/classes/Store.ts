import { normalize } from 'path'
import { writeFileSync, readFileSync } from 'fs'
import { print } from '../util/print'
import { Guild, GuildChannel, Client } from 'discord.js'
import { GuildConfig, IRawGuildGonfig } from '../classes/GuildConfig'

export default class Store {
	constructor(path: string, private bot: Client) {
		this.path = normalize(path)
	}

	private configs: { [id: string]: GuildConfig }
	private readonly path: string

	configArray() {
		return Object.values(this.configs)
	}

	save() {
		const json = JSON.stringify(this, null, 4)

		writeFileSync(this.path, json)
		print(`Saved state`)
	}

	load() {
		print('Reading file ' + this.path)
		try {
			const file = readFileSync(this.path, { encoding: 'utf-8' })
			const saveSate = JSON.parse(file)

			this.populate(saveSate)
		} catch (error) {
			print
		}
		this.save()
	}

	private populate(saveSate: IRawSaveState) {
		this.configs = {}

		for (const x in saveSate.configs)
			this.configs[x] = new GuildConfig(saveSate.configs[x], this.bot)
	}

	getConfig(guild: Guild) {
		const { id } = guild
		const server = this.configs[id]
		if (server) return server

		return this.addConfig(id)
	}

	private addConfig(id) {
		return (this.configs[id] = GuildConfig.create(id, this.bot))
	}

	streamerRecordExists(guild: Guild, name: string) {
		return this.getConfig(guild).streamerRecordExists(name)
	}

	addStreamer(guild: Guild, name: string) {
		return this.getConfig(guild).addStreamer(name)
	}

	removeStreamer(guild: Guild, name: string) {
		return this.getConfig(guild).removeStreamer(name)
	}

	addOutput(guild: Guild, output: GuildChannel) {
		return this.getConfig(guild).addOutput(output)
	}

	removeOutput(guild: Guild, idToRemove: string) {
		return this.getConfig(guild).removeOutput(idToRemove)
	}

	toJSON(): IRawSaveState {
		const configs = {}

		for (const id in this.configs)
			if (this.configs.hasOwnProperty(id))
				configs[id] = this.configs[id].toRaw()

		return { configs }
	}
}

interface IRawSaveState {
	configs: IRawConfigStore
}

interface IRawConfigStore {
	[id: string]: IRawGuildGonfig
}

export interface IStreamerRecord {
	/** Name of channel */
	readonly name: string

	/** Is channel live */
	online: boolean

	/** ID of the current stream */
	current: number
}
