/** A set of functions being a wrapper on the Detox's native methods to make developing tests even easier */
import Detox, { by, device, waitFor } from 'detox';
import { getText } from 'detox-getprops';

import { WAIT_FOR_ELEMENT_TIMEOUT } from './data';

interface TypeTextOptions {
  replace?: boolean;
  closeKeyboard?: boolean;
}

interface ScrollToElementOptions {
  pixels: number;
  direction: Detox.Direction;
  startX: number;
  startY: number;
}

const Actions = () => {
  const waitForElement = async (target: Detox.IndexableNativeElement | Detox.NativeElement, timeout?: number) => {
    await waitFor(target)
      .toBeVisible()
      .withTimeout(timeout || WAIT_FOR_ELEMENT_TIMEOUT.DEFAULT);
  };

  const typeText = async (
    target: Detox.IndexableNativeElement | Detox.NativeElement,
    text: string,
    options?: TypeTextOptions,
  ) => {
    await waitForElement(target);

    if (options?.replace) {
      await target.clearText();
    }

    if (options?.closeKeyboard && !text.endsWith('\n')) {
      text = `${text}\n`;
    }

    await target.typeText(text);
  };

  /** Pastes the whole string without typing. Use only during non-user behaviour testing. */
  const replaceText = async (
    target: Detox.IndexableNativeElement | Detox.NativeElement,
    text: string,
    options?: TypeTextOptions,
  ) => {
    await waitForElement(target);

    if (options?.replace) {
      await target.clearText();
    }

    if (options?.closeKeyboard) {
      text = `${text}\n`;
    }

    await target.replaceText(text);
  };

  const tap = async (target: Detox.IndexableNativeElement | Detox.NativeElement) => {
    await waitForElement(target);
    await target.tap();
  };

  const multiTap = async (target: Detox.IndexableNativeElement | Detox.NativeElement, times: number) => {
    await waitForElement(target);
    await target.multiTap(times);
  };

  const scrollToElement = async (
    target: Detox.IndexableNativeElement | Detox.NativeElement,
    scrollable: string,
    options?: Partial<ScrollToElementOptions>,
  ) => {
    const { pixels = 100, direction = 'down', startX = NaN, startY = NaN } = options ?? {};

    await waitFor(target).toBeVisible().whileElement(by.id(scrollable)).scroll(pixels, direction, startX, startY);
  };

  const swipeCarousel = async (
    carousel: Detox.IndexableNativeElement | Detox.NativeElement,
    direction: 'left' | 'right',
  ) => {
    await waitFor(carousel).toBeVisible().withTimeout(WAIT_FOR_ELEMENT_TIMEOUT.DEFAULT);

    await carousel.swipe(direction, 'fast', 0.75, 0.5);
  };

  /** Swipes screen from top to bottom to refresh scrollView */
  const refreshView = async (scrollView: string) => {
    await waitFor(Detox.element(by.id(scrollView)))
      .toBeVisible()
      .withTimeout(WAIT_FOR_ELEMENT_TIMEOUT.DEFAULT);

    await Detox.element(by.id(scrollView)).swipe('down', 'fast', 0.75, 0.5);
  };

  /** Scrolls down and up to find an element */
  const searchForElement = async (target: Detox.IndexableNativeElement | Detox.NativeElement, scrollable: string) => {
    const pixels = 100;

    try {
      await waitFor(target).toBeVisible().whileElement(by.id(scrollable)).scroll(pixels, 'down', NaN, 0.5);

      return;
    } catch (error) {}

    try {
      await waitFor(target).toBeVisible().whileElement(by.id(scrollable)).scroll(pixels, 'up', NaN, 0.5);

      return;
    } catch (error) {
      throw error;
    }
  };

  const getElementsText = async (target: Detox.IndexableNativeElement | Detox.NativeElement): Promise<string> => {
    // ignores are necessary because of inaccurate/missing type definitions
    if (device.getPlatform() === 'android') {
      // @ts-ignore
      return getText(target);
    } else {
      // @ts-ignore
      const attr = await target.getAttributes();

      if ('text' in attr && typeof attr.text === 'string') {
        return attr.text;
      }

      const firstElement = 'elements' in attr ? attr.elements[0] : undefined;

      if (firstElement && 'text' in firstElement && typeof firstElement.text === 'string') {
        return firstElement.text;
      }

      return '';
    }
  };

  return {
    waitForElement,
    typeText,
    replaceText,
    tap,
    multiTap,
    scrollToElement,
    swipeCarousel,
    refreshView,
    searchForElement,
    getElementsText,
  };
};

export default Actions();
