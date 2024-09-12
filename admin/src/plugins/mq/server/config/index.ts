export interface MqPluginConfig {
  CLOUDAMQP_URL: string
}

export default {
  default: ({ env }) => (<MqPluginConfig>{
    CLOUDAMQP_URL: env('CLOUDAMQP_URL'),
  }),
  validator: (config: MqPluginConfig) => {
    if (typeof config.CLOUDAMQP_URL !== 'string') {
      throw new Error('KAFKA_CLIENT_ID has to be a string')
    }
  }
};
