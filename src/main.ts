import { WebClient } from "@slack/web-api"
import "dotenv/config"

const webClient = new WebClient(process.env["BOT_USER_OAUTH_TOKEN"]);

(async () => {
	// チャンネル一覧を取得
	const channels = await webClient.conversations.list().then(result => result.channels)
	if (channels === undefined) {
		return
	}
	for (let channel of channels) {
		console.log(`${channel.id}: ${channel.name}`)
	}
})()