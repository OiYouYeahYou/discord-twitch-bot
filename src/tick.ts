import { Guild } from 'discord.js'

import { Embed } from './discord'
import { StreamerRecord } from './classes/StreamerRecord'
import { ChannelHandler } from './classes/ChannelHandler'
import App from './classes/App'
import { APIError } from './twitch'

export const Tick = (app: App) => async () => {
	for (const guildConfig of app.store.configArray()) {
		const { id, outputs } = guildConfig

		if (!outputs.length) continue

		const guild = app.client.guilds.find('id', id)
		if (!guild) continue

		for (const streamer of guildConfig.streamerArray())
			try {
				await apiCallback(app, outputs, streamer, guild)
			} catch (err) {
				app.print('Tick error', err.message)
			}
	}
}

export async function apiCallback(
	app: App,
	channels: ChannelHandler[],
	streamer: StreamerRecord,
	guild: Guild
) {
	const response = await app.twitch.getStream(streamer.name)
	if (response instanceof APIError) throw response

	const { stream } = response
	let message, type

	if (stream) {
		if (streamer.isSameStream(stream)) return

		streamer.setOnline(stream)

		message = Embed(stream)
		type = 'stream live'
	} else {
		if (streamer.isOffline) return

		message = `${streamer.name}'s stream is over`
		type = 'end of stream'

		streamer.setOffline()
	}

	await sendToChannels(app, guild, streamer, channels, message, type)
}

export async function sendToChannels(
	app: App,
	guild: Guild,
	streamer: StreamerRecord,
	channels: ChannelHandler[],
	message,
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
