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

export type APIcallback = ( server: IServer, twitchChannel?, response?) => any

export interface ITwitchChannel {
	name: string
	timestamp: number
	online: boolean
}

export interface ITwtichResponse {
	stream: {
		channel: {
			display_name: string
			url: string
			game: string
			status: string
			logo: string
			followers: number
		}
		preview: {
			large: string
		}
		viewers: number
		created_at: string
	}
}
