import { Client } from 'discord.js'
import Store from './Store'
import List from './List'
import { Twitch as _Twitch } from '../twitch'
import { twitchToken } from '../constants'
import { Tick as _Tick } from '../tick'

export default class App {
	public tick: () => Promise<void>

	constructor(
		public bot: Client,
		public store: Store,
		public list: List,
		public twitch = new _Twitch(twitchToken),
		Tick = _Tick
	) {
		this.tick = Tick(this)
	}
}
