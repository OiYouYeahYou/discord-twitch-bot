import { Message } from 'discord.js'
import { timer } from '../util/util'
import { GuildConfig } from './GuildConfig'
import App from './App'

export default class Request {
	constructor(
		readonly app: App,
		readonly guildConfig: GuildConfig,
		readonly message: Message,
		readonly prefix: string,
		readonly text: string
	) {}

	get guild() {
		return this.message.guild
	}
	get channel() {
		return this.message.channel
	}
	get member() {
		return this.message.member
	}
	get author() {
		return this.message.author
	}
	get client() {
		return this.message.client
	}
	get bot() {
		return this.client.user
	}
	get voiceConnection() {
		return this.guild.voiceConnection
	}

	get screenname() {
		return this.message.member.nickname || this.message.author.username
	}

	get list() {
		return this.app.list
	}

	get store() {
		return this.app.store
	}

	get twitch() {
		return this.app.twitch
	}

	tick() {
		return this.app.tick()
	}

	async send(text, options?: any) {
		const message = await this.message.channel.send(text, options)
		return Array.isArray(message) ? message[0] : message
	}

	async reply(text, options?: any) {
		return this.message.reply(text, options)
	}

	async destructingReply(text: string) {
		const msg = await this.reply(text)

		await timer(10 * 1000)

		try {
			// @ts-ignores
			await msg.delete()
		} catch (error) {
			console.error(error)
		}
	}

	async delete() {
		if (this.message.deletable) {
			return this.message.delete()
		}
	}

	async somethingWentWrong(err) {
		console.log(err)
		return this.destructingReply(`Something went wrong`)
	}

	async missingArguments() {
		return this.send('Please specify an argument for channel')
	}
}
