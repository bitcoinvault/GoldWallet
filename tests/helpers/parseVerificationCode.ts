import { JSDOM } from 'jsdom';

export function getCodeFromHtmlBody(htmlBody: string): string {
  const dom = new JSDOM(htmlBody);
  const pinCodeElement = dom.window.document.querySelector('#id_pincode');

  if (!pinCodeElement?.textContent) {
    throw new Error('Email verification code element #id_pincode was not found.');
  }

  return pinCodeElement.textContent;
}
