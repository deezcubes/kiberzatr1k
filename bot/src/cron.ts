import {CronJob} from "cron";
import {listWithTitle, nextWeek} from "./bot";
import {config} from "./config";
import dayjs, {ManipulateType} from "dayjs";
import {getActiveDeadlines} from "./model";
import {readFileSync, writeFileSync} from "node:fs";

const remindersConfig: { value: string, unit: ManipulateType, name: string }[] = [
    {value: "0", unit: 'minute', name: '‼️ Прямо сейчас наступают дедлайн(ы):'},
    {value: "1", unit: 'hour', name: '‼️ Через час наступят дедлайн(ы):'},
]

const cronJobs = [
    new CronJob(
        '0 6 * * *',
        async () => {
            const deadlines = await getActiveDeadlines();
            await listWithTitle(config.CHAT_ID,
                "‼️ Дедлайны на сегодня:",
                deadlines.filter(it => it.datetime.isSame(dayjs(), 'date'))
            )
        }
    ),
    new CronJob(
        '0 16 * * *',
        async () => {
            const deadlines = await getActiveDeadlines();
            await listWithTitle(config.CHAT_ID,
                "‼️ Дедлайны на сегодня и завтра:",
                deadlines.filter(it => it.datetime.isSame(dayjs(), 'date') ||
                it.datetime.isSame(dayjs().add(1, 'day'), 'date'))
            )
        }
    ),
    new CronJob(
        '0 20 * * 6',
        async () => {
            const deadlines = await getActiveDeadlines();
            await listWithTitle(config.CHAT_ID,
                "‼️ Дедлайны на следующую неделю:",
                deadlines.filter(it => it.datetime.isBefore(
                    dayjs().add(8, 'day')
                        .add(4, 'hour'))
                )
            )
        }
    ),
    new CronJob(
        '* * * * *',
        async () => {
            const fileData = readFileSync('./data/remind.json', 'utf-8');
            const jsonData: { [key: string]: [number]} = JSON.parse(fileData);
            const deadlines = await getActiveDeadlines();
            console.log(deadlines)
            for (const remind of remindersConfig) {
                const remindList = deadlines.filter(
                    d => d.datetime.isBefore(
                        dayjs().add(1, remind.unit)
                    )
                ).filter(d => !(d.id in jsonData[remind.value]));
                remindList.forEach(d => jsonData[remind.value].push(d.id))
                writeFileSync('./data/remind.json', JSON.stringify(jsonData))
                if (remindList.length != 0) {
                    await listWithTitle(config.CHAT_ID,
                        remind.name,
                        remindList
                    )
                }
            }
        }
    ),
]

export function startJobs() {
    cronJobs.forEach(it => it.start())
}