import { Client } from 'discord.js'

import { print, getPersistence, saveState } from './util'
import { token, tickInterval, saveInterval, channelPath } from './constants'
import { IServer } from './types'
import { messageReceived } from './messageHandling'
import { tick } from './tick'

export const servers: IServer[] = getPersistence()

export const bot = new Client()
bot.on( 'message', messageReceived )
start().catch( err => {
	print( 'An error occured while loging in:', err )
	process.exit( 1 )
} )

async function start() {
	await bot.login( token )
	print( 'Logged in with token ' + token )
	print( `State store ${ channelPath }` )

	await tick()
	bot.setInterval( tick, tickInterval )
	bot.setInterval( saveState, saveInterval )

	const invite = await bot.generateInvite( [] )
	print( invite )

	require( './exitHandling' )
}
