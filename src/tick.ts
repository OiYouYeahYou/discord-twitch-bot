import { Guild, Client } from 'discord.js'

import { getStream, APIError } from './twitch'
import { print } from './util/print'
import { Embed } from './discord'
import { StreamerRecord } from './classes/StreamerRecord'
import { ChannelHandler } from './classes/ChannelHandler'
import Store from './classes/Store'

export const Tick = (bot: Client, store: Store) =>
	async function tick() {
		for (const server of store.configArray()) {
			const { id, outputs } = server

			const guild = bot.guilds.find('id', id)
			if (!guild) continue

			for (const twitchChannel of server.recordsArray()) {
				if (!outputs.length) continue

				try {
					await apiCallback(outputs, twitchChannel, guild)
				} catch (err) {
					print('Tick error', err)
				}
			}
		}
	}

async function apiCallback(
	channels: ChannelHandler[],
	twitchChannel: StreamerRecord,
	guild: Guild
) {
	const response = await getStream(twitchChannel.name)
	if (response instanceof APIError) {
		if (response.status === 404)
			print(`Unable to find ${twitchChannel.name} in ${guild.name}`)

		return
	}

	const { stream } = response
	if (!stream) {
		if (twitchChannel.isOnline)
			sendToChannels(
				guild,
				twitchChannel,
				channels,
				`${twitchChannel.name}'s stream is over`,
				'end of stream'
			)

		twitchChannel.setOffline()
		return
	}

	if (twitchChannel.isSameStream(stream)) return

	twitchChannel.setOnline(stream)

	const embed = Embed(stream)
	sendToChannels(guild, twitchChannel, channels, embed, 'stream live')
}

async function sendToChannels(
	guild: Guild,
	streamer: StreamerRecord,
	channels: ChannelHandler[],
	message,
	type: string
) {
	for (const channel of channels) {
		try {
			await channel.send(message)
			print(
				`Sent ${type} message for ${streamer.name} to channel ${
					channel.name
				} on ${guild.name}`
			)
		} catch (err) {
			print(
				`Failed to ${type} message for ${streamer.name} to ${
					channel.name
				} on ${guild.name}`,
				err
			)
		}
	}
}
