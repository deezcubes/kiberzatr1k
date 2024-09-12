import 'node-fetch'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import 'dayjs/locale/ru.js'
import {bot} from "./bot";

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)
dayjs.locale('ru')

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
