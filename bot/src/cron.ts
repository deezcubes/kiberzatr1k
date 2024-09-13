import {CronJob} from "cron";
import {nextWeek} from "./bot";
import {config} from "./config";
import {ManipulateType} from "dayjs";

const remindersConfig: { value: number, unit: ManipulateType, name: string }[] = [
    {value: 0, unit: 'minute', name: 'Прямо сейчас дедлайн(ы):'},
    {value: 1, unit: 'hour', name: 'Через час дедлайн(ы):'},
]

export function defineJobs() {
    new CronJob(
        '0 6 * * *',
        function () {
            nextWeek(config.CHAT_ID)
        },
        null,
        true
    );

    // TO DO: Make a job to remind
    // new CronJob(
    //     '0 6 * * *'
    // )
}