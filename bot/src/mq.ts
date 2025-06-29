import { AMQPClient } from '@cloudamqp/amqp-client'
import {config} from "./config";

export type EventType = 'CREATED' | 'UPDATED'

interface PlayerMqDto {
    id: number,
    name: string,
    tgid: number
}

export interface DeadlineMqDto {
    id: number,
    name: string,
    datetime: string,
    comment: string | null,
    link: string | null,
    players: PlayerMqDto[],
    campaign: string | null
}

export interface MqMessage {
    type: EventType,
    entry: DeadlineMqDto
}

export const handleMqEvents = async (callback: (message: MqMessage) => Promise<void>) => {
    const connection = new AMQPClient(config.AMQP_URL)
    await connection.connect()
    const channel = await connection.channel()
    const queue = await channel.queue('updates', {durable: true})

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await queue.subscribe({}, async (msg) => {
        try {
            const mqMessage = <MqMessage>JSON.parse(<string>msg.bodyString())
            await callback(mqMessage)
        } catch (e) {
            console.error('Error while receiving mq message', e)
        }
    })
}