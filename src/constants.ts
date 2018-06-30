import { print } from './util'

export interface IConfig {
	discordToken: string
	twitchClientID: string
	tick: number
	save: number
}

const expectedKeys = ['discordToken', 'twitchClientID', 'tick', 'save']

const config: IConfig = require('../config.json')
const { twitchClientID, discordToken } = config

for (var key in config)
	if (config.hasOwnProperty(key))
		if (!(expectedKeys.indexOf(key) + 1))
			print(`Unexpected config key: ${key}`)

if (!twitchClientID) throw new Error('No Twitch client-id')

if (!discordToken) throw new Error('No Discord Token')

export const token = discordToken
export const tickInterval = Number(config.tick || 3 * 60) * 1000
export const saveInterval = Number(config.save || 5 * 60) * 1000

export const host = 'api.twitch.tv'
export const headers = {
	'Client-ID': twitchClientID,
	Accept: 'application/vnd.twitchtv.v3+json',
}

export const statePath = __dirname + '/../.state.json'
