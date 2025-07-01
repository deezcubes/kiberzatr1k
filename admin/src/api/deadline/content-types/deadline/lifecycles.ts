type EventType = 'CREATED' | 'UPDATED'

interface LocationMqDto {
  id: number,
  name: string,
  link: string
}

interface DeadlineMqDto {
  id: number,
  name: string,
  datetime: string,
  comment: string | null,
  link: string | null,
  players: any,
  campaign: string | null,
  location: LocationMqDto | null
}

async function sendEvent(type: EventType, id: number) {
  const rawEntry = await strapi.entityService.findOne('api::deadline.deadline', id, {
    populate: {players: true, campaign: true, location: true},
  });
  console.log(rawEntry.players)
  const entry = <DeadlineMqDto>{
    id,
    name: rawEntry.name,
    datetime: rawEntry.datetime,
    comment: rawEntry.comment ?? null,
    link: rawEntry.link ?? null,
    players: rawEntry.players,
    campaign: rawEntry.campaign?.title ?? null,
    location: rawEntry.location ?? null
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
