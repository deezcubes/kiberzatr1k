import type {Context, Next} from 'koa';
import {Strapi} from "@strapi/strapi";
import ical, {ICalCalendarMethod, ICalEventData} from 'ical-generator'
import Deadline from "./deadline";

export default ({ strapi }: { strapi: Strapi }) => ({
    async getIcalFeed (ctx: Context) {
        const calendar = ical({ name: 'calender' });
        calendar.method(ICalCalendarMethod.REQUEST);

        // todo проверить что тут все дедлайны отдаются
        const deadlines = await strapi.entityService.findMany('api::deadline.deadline', {
            populate: {subject: true},
        });

        for (const deadline of deadlines) {
            calendar.createEvent(<ICalEventData>{
                id: deadline.id,
                summary: (deadline.subject ? `[${deadline.subject.name}] ` : '') + deadline.name,
                description: deadline.comment ?? null,
                url: deadline.link ?? null,
                start: deadline.datetime
            })
        }

        ctx.res.statusCode = 200;
        ctx.res.appendHeader('Content-Type', 'text/calendar; charset=utf-8');
        ctx.res.appendHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
        ctx.body = calendar.toString()
    }
})
