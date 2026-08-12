const sentryTimestampMessage = 'Error when deserializing millis timestamp format.';

export const isSentryTimestampDeserializationError = line =>
  line.includes('E RNSentry:') &&
  (line.includes(sentryTimestampMessage) || line.includes('timestamp is not millis format'));
