import {CronJob} from "cron";
import {listWithTitle} from "./bot";
import {config} from "./config";
import dayjs, {ManipulateType} from "dayjs";
import {getActiveDeadlines} from "./model";
import fs from "node:fs";

interface Reminder {
    value: number,
    unit: ManipulateType,
    name: string
}

function getReminderId(reminder: Reminder): string {
    return String(reminder.value) + '_' + reminder.unit
}

const remindersConfig: Reminder[] = [
    {value: 0, unit: 'minute', name: '‼️ Прямо сейчас наступают дедлайн(ы):'},
    {value: 1, unit: 'hour', name: '‼️ Через час наступят дедлайн(ы):'},
]

interface FileData {
    [key: string]: number[]
}

const FILE_DATA_PATH = './data/remind.json'

function readFileData(): FileData {
    if (!fs.existsSync(FILE_DATA_PATH)) {
        return {}
    }

    const rawData = fs.readFileSync(FILE_DATA_PATH, 'utf-8');
    return <FileData>JSON.parse(rawData);
}

function writeFileData(data: FileData) {
    fs.writeFileSync(FILE_DATA_PATH, JSON.stringify(data), 'utf-8')
}

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
            const deadlines = await getActiveDeadlines();
            const jsonData = readFileData()
            for (const remind of remindersConfig) {
                const reminderId = getReminderId(remind)
                if (!(reminderId in jsonData)) {
                    jsonData[reminderId] = []
                }
                const deadlineList = <number[]>jsonData[reminderId]
                const remindList = deadlines.filter(
                    d => d.datetime.isBefore(
                        dayjs().add(remind.value, remind.unit)
                    )
                ).filter(d => !(d.id in deadlineList));
                deadlineList.push(...remindList.map(it => it.id))
                if (remindList.length !== 0) {
                    await listWithTitle(config.CHAT_ID,
                        remind.name,
                        remindList
                    )
                }
            }
            writeFileData(jsonData)
        }
    ),
]

export function startJobs() {
    cronJobs.forEach(it => { it.start(); })
}