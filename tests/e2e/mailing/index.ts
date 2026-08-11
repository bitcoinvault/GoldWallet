import mailosaur from 'mailosaur';
import type { SearchCriteria, Message } from 'mailosaur';

import { getCodeFromHtmlBody } from '../../helpers/parseVerificationCode';
import { envData } from '../data';

const API_KEY = process.env['MAILOSAUR_API_KEY'];
const SERVER_ID = process.env['MAILOSAUR_SERVER_ID'];

if (!API_KEY || !SERVER_ID) {
  throw new Error(
    'Please provide Mailosaur API key and server id in MAILOSAUR_API_KEY and MAILOSAUR_SERVER_ID env variables.',
  );
}

export enum Subject {
  ADD_EMAIL = 'BTCV Team: you requested to add an email for BTCV Email Notifications',
  CHANGE_EMAIL = 'BTCV Team: you requested to change email for BTCV Email Notifications',
  SUBSCRIBE = 'BTCV Team: you requested to subscribe to BTCV Email Notifications',
  UNSUBSCRIBE = 'BTCV Team: you requested to unsubscribe from BTCV Email Notifications',
}

const client = new mailosaur(API_KEY);

interface Mailing {
  /**
   * Generate random unique email address
   * @example
   * const emailAddress = mailing.generateAddress();
   */
  generateAddress(): string;

  /**
   * Get email confirmation code from email message sent to provided address
   * @param {string} email
   * @param {Subject} subject
   * @returns {Promise<string>} code
   */
  getCode(email: string, subject: Subject): Promise<string>;

  /**
   * Wait for email message to be received on provided address then delete it
   * @param {string} email
   * @returns {Promise<void>}
   */
  ignoreEmail(email: string): Promise<void>;
}

const mailing: Mailing = {
  generateAddress() {
    return client.servers.generateEmailAddress(SERVER_ID);
  },

  async getCode(email: string, subject: Subject) {
    const message = await getMessage({
      sentTo: email,
      subject,
    });

    return getCodeFromHtmlBody(message.html!.body!);
  },

  async ignoreEmail(email: string) {
    const message = await getMessage({ sentTo: email });

    return deleteMessage(message.id!);
  },
};

/**
 * Return last message found with provided criteria.
 * If no message is found it waits for message for two minutes
 * @param {SearchCriteria} criteria
 * @returns {Promise<Message>}
 * @throws When no message was received in specifed timeframe
 */
async function getMessage(criteria: SearchCriteria): Promise<Message> {
  return client.messages.get(
    SERVER_ID!,
    {
      ...criteria,
      sentFrom: envData.emailNotificationSenderAddress,
    },
    {
      timeout: 2 * 60 * 1000,
    },
  );
}

/**
 * Deletes email message
 * @param {string} id of the message
 * @returns {Promise<void>}
 */
async function deleteMessage(id: string): Promise<void> {
  return client.messages.del(id);
}

export default mailing;
