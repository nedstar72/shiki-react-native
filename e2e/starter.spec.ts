import { expect } from 'detox';

describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    // Не можем использовать reloadReactNative, см. https://github.com/wix/Detox/issues/4760
    // await device.reloadReactNative();
  });

  it('should show hello screen after tap', async () => {
    await expect(element(by.text('Hello World! 🚀'))).toBeVisible();
  });
});
