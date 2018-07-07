import { Client, Message } from 'discord.js'

import { isPrefixed } from './util/util'
import { token, tickInterval, saveInterval } from './constants'
import { main } from './messageHandling'
import App from './classes/App'
import { setupExitHandling } from './exitHandling'

export const client = new Client()
const app = new App(client, main)

client.on('error', error => app.print(error.message))
client.on('disconnect', () => app.print('disconnection'))
client.on('reconnecting', () => app.print('reconnecting'))
client.on('message', messageReceived)

start().catch(err => {
	app.print('An error occured while loging in:', err)
	process.exit(1)
})

function messageReceived(message: Message) {
	const { guild } = message

	if (!guild) return

	const serverConfig = app.store.getConfig(guild)
	const { prefix } = serverConfig
	const content = message.content.trim()

	if (isPrefixed(prefix, content))
		return main.run(app, message, serverConfig, content, prefix)
}

async function start() {
	await client.login(token)
	app.print('Logged in with token ' + token)

	app.load()

	await app.tick()
	client.setInterval(app.tick, tickInterval)
	client.setInterval(() => app.save(), saveInterval)

	app.print(await client.generateInvite([]))

	setupExitHandling(app)
}
