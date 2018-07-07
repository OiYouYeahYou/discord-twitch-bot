import { Client } from 'discord.js'
import _Store from './Store'
import List from './List'
import { Twitch as _Twitch } from '../twitch'
import {
	twitchToken as _twitchToken,
	statePath as _statePath,
} from '../constants'
import { Tick as _Tick } from '../tick'
import { print as _print } from '../util/print'

export default class App {
	public tick: () => Promise<void>
	public store: _Store
	public twitch: _Twitch
	private _print: (...args: any[]) => void

	constructor(
		public client: Client,
		public list: List,
		{
			Tick = _Tick,
			Store = _Store,
			twitchToken = _twitchToken,
			statePath = _statePath,
			print = _print,
		} = {}
	) {
		this.store = new Store(this, statePath)
		this.twitch = new _Twitch(twitchToken)
		this.tick = Tick(this)
		this._print = print
	}

	print(...args: any[]) {
		this._print(...args)
	}

	save() {
		return this.store.save()
	}

	load() {
		return this.store.load()
	}
}
