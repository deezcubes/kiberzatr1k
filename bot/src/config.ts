import 'dotenv/config'

export interface Config {
    BOT_TOKEN: string,
    API_TOKEN: string,
    AMQP_URL: string
}

export const config: Config = <Config>{
    BOT_TOKEN: process.env.BOT_TOKEN,
    API_TOKEN: process.env.API_TOKEN,
    AMQP_URL: process.env.AMQP_URL,
}