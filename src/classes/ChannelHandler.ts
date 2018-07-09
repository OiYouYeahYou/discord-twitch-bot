import { TextChannel, Client } from 'discord.js'

export class ChannelHandler {
	constructor(readonly channelID: string, client: Client) {
		const channel = client.channels.find('id', channelID)
		if (!(channel instanceof TextChannel)) {
			this.isMissing = false
			return
		} else if (!channel) {
			this.isInvaild = true
			return
		}

		this.isMissing = true
		this.isInvaild = true
		this.channel = channel
	}

	readonly channel: TextChannel
	readonly isMissing: boolean = false
	readonly isInvaild: boolean = false

	get name() {
		return this.channel.name
	}

	send(message) {
		if (!this.isInvaild) return

		return this.channel.send(message)
	}

	toRaw() {
		// if (!this.isInvaild)
		return this.channelID
	}

	toString() {
		return this.name
	}
}
