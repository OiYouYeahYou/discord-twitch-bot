import { Client, Message } from 'discord.js'

import { isPrefixed } from './util/util'
import { print } from './util/print'
import { token, tickInterval, saveInterval, statePath } from './constants'
import { main } from './messageHandling'
import Store from './classes/Store'
import App from './classes/App'
import { setupExitHandling } from './exitHandling'

export const bot = new Client()
export const store = new Store(statePath, bot)
const app = new App(bot, store, main)

bot.on('error', error => print(error.message))
bot.on('disconnect', event => print('disconnection'))
bot.on('reconnecting', () => print('reconnecting'))
bot.on('message', messageReceived)

start().catch(err => {
	print('An error occured while loging in:', err)
	process.exit(1)
})

function messageReceived(message: Message) {
	const { guild } = message

	if (!guild) return

	const serverConfig = store.getConfig(guild)
	const { prefix } = serverConfig
	const content = message.content.trim()

	if (isPrefixed(prefix, content))
		return main.run(app, message, serverConfig, content, prefix)
}

async function start() {
	await bot.login(token)
	print('Logged in with token ' + token)

	store.load()

	await app.tick()
	bot.setInterval(app.tick, tickInterval)
	bot.setInterval(() => store.save(), saveInterval)

	print(await bot.generateInvite([]))

	setupExitHandling(store)
}
