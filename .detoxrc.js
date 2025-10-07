const IOS_SIMULATOR = process.env.IOS_SIMULATOR;
const ANDROID_EMULATOR = process.env.ANDROID_EMULATOR;
const HEADLESS = process.env.CI ? true : false;
const CLEANUP = process.env.CI ? true : false;

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  artifacts: {
    rootDir: './e2e_artifacts',
    plugins: {
      instruments: 'none', // Отключен, т.к iOS only
      log: 'none',
      uiHierarchy: 'disabled', // Отключен, т.к iOS only
      screenshot: 'none',
      video: 'failing',
    },
  },
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobalExpect: false,
    },
    cleanup: {
      shutdownDevice: CLEANUP,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Shiki.app',
      build:
        'xcodebuild -workspace ios/Shiki.xcworkspace -scheme Shiki -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build | bundle exec xcpretty',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Shiki.app',
      build:
        'xcodebuild -workspace ios/Shiki.xcworkspace -scheme Shiki -configuration Release -sdk iphonesimulator -derivedDataPath ios/build | bundle exec xcpretty',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      headless: HEADLESS,
      device: {
        type: IOS_SIMULATOR,
      },
    },
    emulator: {
      type: 'android.emulator',
      headless: HEADLESS,
      device: {
        avdName: ANDROID_EMULATOR,
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
