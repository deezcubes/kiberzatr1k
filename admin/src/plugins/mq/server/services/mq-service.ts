import { Strapi } from '@strapi/strapi';
import { AMQPClient } from '@cloudamqp/amqp-client'
import {MqPluginConfig} from "../config";

export default async function createMqPlugin({ strapi }: { strapi: Strapi }) {
  const config: MqPluginConfig = strapi.config.get('plugin.mq') as unknown as MqPluginConfig

  const connection = new AMQPClient(config.CLOUDAMQP_URL)
  await connection.connect()
  const channel = await connection.channel()
  const queue = await channel.queue('updates', {durable: true})

  return {
    async send(message: any) {
      await queue.publish(JSON.stringify(message))
    }
  }
}
