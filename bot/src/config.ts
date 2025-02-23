import 'dotenv/config'

export interface Config {
    BOT_TOKEN: string,
    API_TOKEN: string,
    AMQP_URL: string
    API_URL: string,
    CHAT_ID: number,
    COUNT_PER_PAGE: number
}

export const config: Config = <Config>{
    BOT_TOKEN: process.env["BOT_TOKEN"],
    API_TOKEN: process.env["API_TOKEN"],
    AMQP_URL: process.env["AMQP_URL"],
    API_URL: process.env["API_URL"],
    CHAT_ID: Number(process.env["CHAT_ID"]),
    COUNT_PER_PAGE: Number(process.env["COUNT_PER_PAGE"] ?? 20)
}

export const phrases = {
    remindBegin: ["давай в лс", "залетай в лс", "жду в личке"],
    remindEnd: ["дорогуша", "зайка", "солнышко"]
}