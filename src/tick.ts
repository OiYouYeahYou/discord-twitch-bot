import { Guild } from 'discord.js'

import { Embed, Sendable } from './discord'
import { StreamerRecord } from './classes/StreamerRecord'
import { ChannelHandler } from './classes/ChannelHandler'
import App from './classes/App'
import { APIError, IStreamRespone } from './twitch'

interface ITickInject {
	_checkStreamer?: (
		app: App,
		outputs: ChannelHandler[],
		streamer: StreamerRecord,
		guild: Guild
	) => Promise<void>
}

export const Tick = (
	app: App,
	{ _checkStreamer = checkStreamer }: ITickInject = {}
) => async () => {
	for (const guildConfig of app.store.configArray()) {
		const { guild, outputs } = guildConfig

		if (!guild) continue
		if (!outputs.length) continue

		for (const streamer of guildConfig.streamerArray())
			try {
				await _checkStreamer(app, outputs, streamer, guild)
			} catch (err) {
				app.print('Tick error', err.message)
			}
	}
}

export async function checkStreamer(
	app: App,
	outputs: ChannelHandler[],
	streamer: StreamerRecord,
	guild: Guild
) {
	const response = await streamer.getStream()
	if (response instanceof APIError) throw response

	const content = await processResponse(streamer, response)

	if (content) {
		const { message, type } = content
		await sendToChannels(app, guild, streamer, outputs, message, type)
	}
}

export async function processResponse(
	streamer: StreamerRecord,
	{ stream }: IStreamRespone
): Promise<{ type: string; message: Sendable } | false> {
	if (stream && streamer.isSameStream(stream)) {
		return
	} else if (stream) {
		streamer.setOnline(stream)

		return { message: Embed(stream), type: 'stream live' }
	} else if (streamer.isOffline) {
		return
	} else {
		streamer.setOffline()

		return {
			message: `${streamer.name}'s stream is over`,
			type: 'end of stream',
		}
	}
}

export async function sendToChannels(
	app: App,
	guild: Guild,
	streamer: StreamerRecord,
	channels: ChannelHandler[],
	message: Sendable,
	type: string
) {
	const typeAndStreamer = `${type} message for ${streamer}`
	const guildString = `on ${guild} (${guild.id})`

	for (const channel of channels) {
		const job = `${typeAndStreamer} to channel ${channel} ${guildString}`

		try {
			await channel.send(message)
			app.print(`Sent ${job}`)
		} catch (err) {
			app.print(`Failed to ${job}`, err)
		}
	}
}
