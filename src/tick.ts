import { servers, bot } from '.'
import { callApi } from './twitch'
import { IServer, ITwitchChannel } from './types'
import { timeout } from './constants'
import { print } from './util'
import { Embed } from './discord'


export function tick() {
	for ( const server of servers )
		for ( const twitchChannel of server.twitchChannels )
			if ( twitchChannel )
				callApi( server, twitchChannel, apiCallback, true )
}

async function apiCallback(
	server: IServer,
	twitchChannel: ITwitchChannel,
	res
) {
	if ( !res )
		return

	const { stream } = res

	if ( !test( res, twitchChannel, stream ) ) {
		twitchChannel.online = false
		return
	}

	try {
		const guild = bot.guilds.find( 'id', server.id )
		const { discordChannels } = server
		const { channels } = guild
		const embed = Embed( res )

		twitchChannel.online = true
		twitchChannel.timestamp = Date.now()

		if ( !discordChannels.length ) {
			const channel = channels.find( 'type', 'text' )
			if ( channel )
				// @ts-ignore
				await sendEmbed( channel, embed )
		}
		else
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

function test( res, twitchChannel: ITwitchChannel, stream: string ) {
	return (
		res
		&& stream
		&& !twitchChannel.online
		&& ( twitchChannel.timestamp + timeout <= Date.now() )
	)
}
