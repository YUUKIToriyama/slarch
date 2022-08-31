import { ConversationsHistoryResponse, WebClient } from '@slack/web-api'
import { Message as ResponseMessage } from "@slack/web-api/dist/response/ConversationsHistoryResponse"

interface User {
	userId: string
	name: string
}

interface Message {
	timestamp: string
	userId: string
	userName: string
	text: string
}

export interface SlarchSettings {
	BOT_USER_OAUTH_TOKEN: string
}
export class Slarch {
	webClient: WebClient
	userList: User[]

	constructor(settings: SlarchSettings) {
		this.webClient = new WebClient(settings.BOT_USER_OAUTH_TOKEN)
		this.userList = []
	}

	private resolveUserName = async (userId: string) => {
		const user = await this.webClient.users.info({
			user: userId
		}).then(result => result.user)
		if (user === undefined || user.id === undefined || user.name === undefined) {
			return
		}
		this.userList.push({
			userId: user.id,
			name: user.name
		})
		return user.name
	}

	private getUserName = (userId: string) => {
		const user = this.userList.find(elem => elem.userId === userId)
		return user !== undefined ? user.name : undefined
	}

	getChannels = async () => {
		const channels = await this.webClient.conversations.list().then(result => result.channels)
		return channels
	}

	archiveMessages = async (channelId: string) => {
		let messages: Message[] = []
		let hasMore: Boolean | undefined = true
		let nextCursor: string | undefined = undefined
		while (hasMore) {
			const response: ConversationsHistoryResponse = await this.webClient.conversations.history({
				channel: channelId,
				cursor: nextCursor,
				limit: 2
			})
			hasMore = response.has_more
			nextCursor = response.response_metadata?.next_cursor
			if (response.messages !== undefined) {
				for (let message of response.messages) {
					// メッセージを保存:
					await this.convertMessage(message).then(result => {
						messages.push(result)
					})
					// スレッドになっている場合はそれも保存
					if (message.thread_ts !== undefined) {
						const threads = await this.webClient.conversations.replies({
							ts: message.thread_ts,
							channel: channelId
						}).then(result => result.messages)
						if (threads !== undefined) {
							for (let thread of threads) {
								await this.convertMessage(thread).then(result => {
									messages.push(result)
								})
							}
						}
					}
				}
			}
		}
		return messages
	}

	private convertMessage = async (message: ResponseMessage) => {
		// Unix Time -> 日本標準時
		const dateTime = new Date(parseFloat(message.ts as string) * 1000)
		// userId -> userName
		let userName = this.getUserName(message.user as string)
		if (userName === undefined) {
			userName = await this.resolveUserName(message.user as string).catch(error => "hoge")
		}
		return {
			timestamp: dateTime.toLocaleString("ja-JP"),
			userId: message.user || "",
			userName: userName || "",
			text: message.text || ""
		}
	}
}
