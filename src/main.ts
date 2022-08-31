import "dotenv/config"
import { Slarch, SlarchSettings } from './Slarch'

const settings: SlarchSettings = {
	BOT_USER_OAUTH_TOKEN: process.env["BOT_USER_OAUTH_TOKEN"] as string
};

(async () => {
	const slarch = new Slarch(settings)
	const channelId = "C04067H8BGD"
	const messages = await slarch.archiveMessages(channelId)
	console.log(messages)
})()