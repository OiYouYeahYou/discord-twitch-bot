import { GuildChannel, Client } from 'discord.js'
import { StreamerRecord, IRawStreamerRecord } from './StreamerRecord'
import { ChannelHandler } from './ChannelHandler'

const defalutConfig = {
	prefix: '!',
	role: 'botadmin',
	outputs: [],
	channels: {},
}

export class GuildConfig {
	constructor(input: IRawGuildGonfig, private client: Client) {
		this.id = input.id
		this.prefix = input.prefix
		this.role = input.role
		this.outputs = input.outputs.map(
			channel => new ChannelHandler(channel, client)
		)

		this.channels = {}
		for (const id in input.channels) {
			this.channels[id] = new StreamerRecord(input.channels[id])
		}
	}

	readonly id: string
	prefix: string
	role: string
	outputs: ChannelHandler[]
	channels: { [name: string]: StreamerRecord }

	streamerRecordExists(name: string) {
		const { channels } = this
		return channels.hasOwnProperty(name) && channels[name]
	}

	addStreamer(name: string) {
		this.channels[name] = StreamerRecord.create(name)
	}

	removeStreamer(name: string) {
		const { channels } = this

		if (!channels.hasOwnProperty(name) && channels[name]) return

		channels[name] = undefined
	}

	addOutput(output: GuildChannel) {
		if (this.outputs.some(out => out.channelID === output.id)) return false

		this.outputs.push(new ChannelHandler(output.id, this.client))

		return true
	}

	removeOutput(idToRemove: string) {
		const { outputs } = this
		const oldLength = outputs.length

		this.outputs = outputs.filter(
			existing => existing.channelID !== idToRemove
		)

		return this.outputs.length !== oldLength
	}

	streamerArray() {
		return Object.values(this.channels)
	}

	static create(id: string, bot: Client) {
		const config = Object.assign({ id }, defalutConfig)
		return new this(config, bot)
	}

	toRaw(): IRawGuildGonfig {
		const { id, prefix, role } = this
		const channels = {}

		const outputs = this.outputs
			.map(output => output.toRaw())
			.filter(Boolean)

		for (const id in this.channels)
			if (this.channels.hasOwnProperty(id))
				channels[id] = this.channels[id].toRaw()

		return { id, prefix, role, outputs, channels }
	}
}

export interface IRawGuildGonfig {
	readonly id: string
	prefix: string
	role: string
	outputs: string[]
	channels: IRawStreamerRecordStore
}

export interface IRawStreamerRecordStore {
	[name: string]: IRawStreamerRecord
}
