import { servers, bot } from '.'
import { getStream, APIError, IStreamRespone } from './twitch'
import { IServer, ITwitchChannel } from './types'
import { timeout } from './constants'
import { print } from './util'
import { Embed, sendEmbed } from './discord'


export async function tick() {
	for ( const server of servers )
		for ( const twitchChannel of server.twitchChannels )
			if ( twitchChannel )
				apiCallback( server, twitchChannel )
}

async function apiCallback( server: IServer, twitchChannel: ITwitchChannel ) {
	const { discordChannels } = server
	if ( !discordChannels.length )
		return

	const response = await getStream( twitchChannel.name )
	if ( !response || response instanceof APIError )
		return

	if ( !test( response, twitchChannel ) ) {
		twitchChannel.online = false
		return
	}

	try {
		const guild = bot.guilds.find( 'id', server.id )
		const { channels } = guild
		const embed = Embed( response )

		twitchChannel.online = true
		twitchChannel.timestamp = Date.now()

		for ( const discordChannel of discordChannels ) {
			const channel = channels.find( 'id', discordChannel )
			if ( channel )
				// @ts-ignore
				await sendEmbed( channel, embed )
		}
	} catch ( err ) {
		print( err )
	}
}

function test( res: IStreamRespone, twitchChannel: ITwitchChannel ) {
	return (
		res
		&& res.stream
		&& !twitchChannel.online
		&& ( twitchChannel.timestamp + timeout <= Date.now() )
	)
}
