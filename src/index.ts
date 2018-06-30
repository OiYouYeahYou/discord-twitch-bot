import { Client, Message } from 'discord.js'

import { isPrefixed } from './util/util'
import { print } from './util/print'
import { token, tickInterval, saveInterval, statePath } from './constants'
import { main } from './messageHandling'
import { Tick } from './tick'
import Store from './classes/Store'

export const bot = new Client()
export const store = new Store(statePath, bot)
const tick = Tick(bot, store)

bot.on('message', function messageReceived(message: Message) {
	const { guild } = message

	if (!guild) return

	const server = store.getConfig(guild)
	const { prefix } = server
	const content = message.content.trim()

	if (isPrefixed(prefix, content))
		return main.run(message, store, server, tick, content, prefix)
})

start().catch(err => {
	print('An error occured while loging in:', err)
	process.exit(1)
})

async function start() {
	await bot.login(token)
	print('Logged in with token ' + token)

	store.load()

	await tick()
	bot.setInterval(tick, tickInterval)
	bot.setInterval(() => store.save(), saveInterval)

	print(await bot.generateInvite([]))

	require('./exitHandling')(store)
}
