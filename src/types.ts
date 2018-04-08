import { Message } from 'discord.js'

export interface IConfig {
	discordToken: string
	twitchClientID: string
	intervalString: number
}

export interface IServer {
	name: string
	id: string
	prefix: string
	role: string
	discordChannels: string[],
	twitchChannels: ITwitchChannel[]
}

export interface IExitHandler {
	save?: boolean
	exit?: boolean
}

export interface SendableChannel {
	send: ( any ) => Promise<Message>
	name: string
}

export interface WithNameProp {
	name: string
}

export interface ITwitchChannel {
	/** Name of channel */
	name: string

	/** Is channel live */
	online: boolean

	/** ID of the current stream */
	current: number
}
