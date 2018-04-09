import { servers, bot } from '.'
import { getStream, APIError } from './twitch'
import { IServer, ITwitchChannel } from './types'
import { print } from './util'
import { Embed, sendEmbed } from './discord'


export async function tick() {
	for ( const server of servers )
		for ( const twitchChannel of server.twitchChannels )
			if ( twitchChannel )
				try {
					await apiCallback( server, twitchChannel )
				} catch ( err ) {
					print( 'Tick error', err )
				}
}

async function apiCallback( server: IServer, twitchChannel: ITwitchChannel ) {
	const { discordChannels } = server
	if ( !discordChannels.length )
		return

	const response = await getStream( twitchChannel.name )
	if ( response instanceof APIError ) {
		if ( response.status === 404 )
			print(
				`Unable to find ${ twitchChannel.name } for ${ server.name }`
			)

		return
	}

	const { stream } = response
	if ( !stream ) {
		twitchChannel.online = false
		twitchChannel.current = 0
		return
	}

	if ( twitchChannel.online && twitchChannel.current == stream._id )
		return

	twitchChannel.online = true
	twitchChannel.current = stream._id

	const guild = bot.guilds.find( 'id', server.id )
	if ( !guild )
		return // Cannot find guild

	const { channels } = guild
	const embed = Embed( stream )

	for ( const discordChannel of discordChannels ) {
		const channel = channels.find( 'id', discordChannel )
		if ( channel )
			// @ts-ignore
			await sendEmbed( channel, embed )
	}
}
