export interface IConfig {
	discordToken: string
	twitchClientID: string
	tickInterval: number
	saveInterval: number
}

const config: IConfig = require( '../config.json' )
const { twitchClientID, discordToken } = config

if ( !twitchClientID )
	throw new Error( 'No Twitch client-id' )

if ( !discordToken )
	throw new Error( 'No Discord Token' )

export const token = discordToken
export const tickInterval = Number( config.tickInterval || ( 3 * 60 ) ) * 1000
export const saveInterval = Number( config.saveInterval || ( 5 * 60 ) ) * 1000

export const host = 'api.twitch.tv'
export const headers = {
	'Client-ID': twitchClientID,
	Accept: 'application/vnd.twitchtv.v3+json'
}

export const channelPath = __dirname + '/../.channels'
