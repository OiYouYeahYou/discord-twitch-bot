import { Client, Message } from 'discord.js'

import { print, isPrefixed } from './util'
import { token, tickInterval, saveInterval, channelPath } from './constants'
import { main } from './messageHandling'
import { tick } from './tick'
import Store from './classes/Store'

export const store = new Store( channelPath )

export const bot = new Client()
bot.on( 'message', function messageReceived( message: Message ) {
	const { guild } = message

	if ( !guild )
		return

	const server = store.getConfig( guild )
	const { prefix } = server
	const content = message.content.trim()

	if ( isPrefixed( prefix, content ) )
		return main.run( message, store, server, content, prefix )
} )

start().catch( err => {
	print( 'An error occured while loging in:', err )
	process.exit( 1 )
} )

async function start() {
	await bot.login( token )
	print( 'Logged in with token ' + token )

	store.load()

	await tick()
	bot.setInterval( tick, tickInterval )
	bot.setInterval( () => store.save(), saveInterval )

	const invite = await bot.generateInvite( [] )
	print( invite )

	require( './exitHandling' )
}
