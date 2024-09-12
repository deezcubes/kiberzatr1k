type EventType = 'CREATED' | 'UPDATED'

interface DeadlineMqDto {
  name: string,
  subject: string | null,
  datetime: string,
  comment: string | null,
  link: string | null
}

async function sendEvent(type: EventType, id: number) {
  const rawEntry = await strapi.entityService.findOne('api::deadline.deadline', id, {
    populate: {subject: true},
  });

  const entry = <DeadlineMqDto>{
    name: rawEntry.name,
    subject: rawEntry.subject?.name ?? null,
    datetime: rawEntry.datetime,
    comment: rawEntry.comment ?? null,
    link: rawEntry.link ?? null
  }

  try {
    const service = await strapi.plugin('mq').service('mq')
    await service.send({
      type,
      entry
    })
  } catch (e) {
    console.error('Error while sending update to MQ', e)
  }
}

export default {
  async afterCreate(event) {
    const createdDeadlineId = event.result.id
    await sendEvent('CREATED', createdDeadlineId)
  },
  async afterUpdate(event) {
    const updatedDeadlineId = event.result.id
    await sendEvent('UPDATED', updatedDeadlineId)
  },
}
