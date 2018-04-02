import { Message } from "discord.js";

export interface IConfig {
	discordToken: string
	twitchClientID: string
	intervalString: number
}

export interface IServer {
	name: string
	id: string
	prefix: string
	lastPrefix?: string
	role: string
	discordChannels: any[],
	twitchChannels: any[]
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
