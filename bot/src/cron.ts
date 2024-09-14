import {CronJob} from "cron";
import {nextWeek} from "./bot";
import {config} from "./config";
import {ManipulateType} from "dayjs";

const remindersConfig: { value: number, unit: ManipulateType, name: string }[] = [
    {value: 0, unit: 'minute', name: 'Прямо сейчас дедлайн(ы):'},
    {value: 1, unit: 'hour', name: 'Через час дедлайн(ы):'},
]

const cronJobs = [
    new CronJob(
        '0 8 * * *',
        async () => {
            // TODO печатаем все на сегодня
        }
    ),
    new CronJob(
        '0 16 * * *',
        async () => {
            // todo печатаем оставшиеся на сегодня и все на завтра
        }
    ),
    new CronJob(
        '0 20 * * 6',
        async () => {
            // todo печатаем все на неделю
        }
    ),
    new CronJob(
        '* * * * *',
        async () => {
            // todo reminder checker
        }
    )
]

export function startJobs() {
    cronJobs.forEach(it => it.start())
}