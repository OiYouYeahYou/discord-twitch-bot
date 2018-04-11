import { Message } from 'discord.js'
import { destructingReply, somethingWentWrong } from '../util'
import List from './List'
import Store, { IGuildGonfig } from './Store';


export default class Request {
	constructor(
		list: List,
		store: Store,
		config: IGuildGonfig,
		message: Message,
		prefix: string,
		text: string
	) {
		this.list = list
		this.store = store
		this.guildConfig = config
		this.message = message
		this.prefix = prefix
		this.text = text
	}

	readonly list: List
	readonly store: Store
	readonly guildConfig: IGuildGonfig
	readonly message: Message
	readonly prefix: string
	readonly text: string

	get guild() { return this.message.guild }
	get channel() { return this.message.channel }
	get member() { return this.message.member }
	get author() { return this.message.author }
	get client() { return this.message.client }
	get bot() { return this.client.user }
	get voiceConnection() { return this.guild.voiceConnection }

	get screenname() {
		return this.message.member.nickname || this.message.author.username
	}

	async send( text, options?: any ) {
		const message = await this.message.channel.send( text, options )
		return Array.isArray( message ) ? message[ 0 ] : message
	}

	async sendCode( lang: string, content: any, options?: any ) {
		return await this.message.channel.sendCode( lang, content )
	}

	async reply( text, options?: any ) {
		return await this.message.reply( text, options )
	}

	async destructingReply( text: string ) {
		return await destructingReply( this.message, text )
	}

	async delete() {
		if ( this.message.deletable )
			return await this.message.delete()
	}

	async somethingWentWrong( err ) {
		return somethingWentWrong( this.message, err )
	}

	async missingArguments() {
		return this.send( 'Please specify an argument for channel' )
	}
}
