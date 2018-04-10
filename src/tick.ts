import { Guild, TextChannel } from 'discord.js'

import { servers, bot } from '.'
import { getStream, APIError } from './twitch'
import { ITwitchChannel } from './types'
import { print } from './util'
import { Embed } from './discord'


export async function tick() {
	for ( const server of servers ) {
		const { id, twitchChannels, discordChannels } = server

		const guild = bot.guilds.find( 'id', id )
		if ( !guild )
			continue

		for ( const twitchChannel of twitchChannels ) {
			if ( !discordChannels.length )
				continue

			try {
				await apiCallback( discordChannels, twitchChannel, guild )
			} catch ( err ) {
				print( 'Tick error', err )
			}
		}
	}
}

async function apiCallback(
	channels: string[],
	twitchChannel: ITwitchChannel,
	guild: Guild
) {
	const response = await getStream( twitchChannel.name )
	if ( response instanceof APIError ) {
		if ( response.status === 404 )
			print( `Unable to find ${ twitchChannel.name } in ${ guild.name }` )

		return
	}

	const { stream } = response
	if ( !stream ) {
		if ( twitchChannel.online )
			sendToChannels(
				guild, twitchChannel, channels,
				`${ twitchChannel.name }'s stream is over`,
				'end of stream'
			)

		twitchChannel.online = false
		twitchChannel.current = 0
		return
	}

	if ( twitchChannel.current == stream._id )
		return

	twitchChannel.online = true
	twitchChannel.current = stream._id

	const embed = Embed( stream )
	sendToChannels( guild, twitchChannel, channels, embed, 'stream live' )
}

async function sendToChannels(
	guild: Guild,
	streamer: ITwitchChannel,
	ids: string[],
	message,
	type: string
) {
	for ( const discordChannel of ids ) {
		const channel = guild.channels.find( 'id', discordChannel )
		if ( !channel )
			continue

		if ( !( channel instanceof TextChannel ) )
			continue

		try {
			await channel.send( message )
			print( `Sent ${ type } message for ${ streamer.name } to channel ${ channel.name } on ${ guild.name }` )
		} catch ( err ) {
			print( `Failed to ${ type } message for ${ streamer.name } to ${ channel.name } on ${ guild.name }`, err )
		}
	}
}
