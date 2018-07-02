import { Client } from 'discord.js'
import Store from './Store'
import List from './List'

export default class App {
	constructor(
		public bot: Client,
		public tick: () => Promise<void>,
		public store: Store,
		public list: List
	) {}
}
