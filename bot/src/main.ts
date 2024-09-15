import 'node-fetch'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import 'dayjs/locale/ru.js'
import {launch} from "./bot";
import {startJobs} from "./cron";

function main() {
    console.log('Start up...')
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(customParseFormat)
    dayjs.extend(relativeTime)
    dayjs.locale('ru')

    launch().then(
        () => { console.log('Bot launched'); },
        (err: unknown) => { console.error('Failed to launch bot: ' + String(err)) }
    )
    startJobs()
}

main()

