export default {
    routes: [
        {
            method: 'GET',
            path: '/ical',
            handler: 'api::deadline.ical.getIcalFeed',
            config: {
                auth: false,
            },
        }
    ]
}
