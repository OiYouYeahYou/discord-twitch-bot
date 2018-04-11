import { normalize } from 'path'
import { writeFileSync, readFileSync } from 'fs'
import { print } from '../util'
import { Guild, GuildChannel } from 'discord.js'


export default class Store {
	constructor( path: string ) {
		this.path = normalize( path )
	}

	private configs: IConfigStore
	// private channels: y
	private readonly path: string

	configArray() {
		return Object.values( this.configs )
	}

	save() {
		const { configs } = this
		const state: ISaveState = { configs }
		const json = JSON.stringify( state, null, 4 )

		writeFileSync( this.path, json )
		print( `Saved state` )
	}

	load() {
		print( 'Reading file ' + this.path )
		try {
			const file = readFileSync( this.path, { encoding: 'utf-8' } )
			const saveSate = JSON.parse( file )

			this.populate( saveSate )
		} catch ( error ) {
			print
		}
	}

	private populate( saveSate: ISaveState ) {
		this.configs = saveSate.configs
		// this.channels = saveSate.channels
	}

	getConfig( guild: Guild ) {
		const { id } = guild
		const server = this.configs[ id ]
		if ( server )
			return server

		return this.configs[ id ] = {
			id,
			prefix: '!',
			role: 'botadmin',
			outputs: [],
			channels: {}
		}
	}

	streamerRecordExists( guild: Guild, name: string ) {
		const { channels } = this.getConfig( guild )
		return channels.hasOwnProperty( name ) && channels[ name ]
	}

	addStreamer( guild: Guild, name: string ) {
		const { channels } = this.getConfig( guild )

		channels[ name ] = {
			name,
			online: false,
			current: 0
		}
	}

	removeStreamer( guild: Guild, name: string ) {
		const { channels } = this.getConfig( guild )

		if ( !channels.hasOwnProperty( name ) && channels[ name ] )
			return

		channels[ name ] = undefined
	}

	addOutput( guild: Guild, output: GuildChannel ) {
		const { outputs } = this.getConfig( guild )
		if ( outputs.some( out => out === output.id ) )
			return false

		outputs.push( output.id )
	}

	removeOutput( guild: Guild, idToRemove: string ) {
		const config = this.getConfig( guild )
		const { outputs } = config
		const oldLength = outputs.length

		config.outputs = outputs.filter( existing => existing !== idToRemove )

		return config.outputs.length === oldLength
	}
}

interface ISaveState {
	configs: IConfigStore
	// channels: IStreamers
}

interface IConfigStore {
	[ id: string ]: IGuildGonfig
}

export interface IGuildGonfig {
	readonly id: string
	prefix: string
	role: string
	outputs: string[]
	channels: IStreamerRecordStore
}

interface IStreamerRecordStore {
	[ name: string ]: IStreamerRecord
}

export interface IStreamerRecord {
	/** Name of channel */
	readonly name: string

	/** Is channel live */
	online: boolean

	/** ID of the current stream */
	current: number
}
