import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { HueDaylightSyncAccessory } from './hue-daylight-sync-accessory';
import { Config } from './types';

export class HueDaylightSyncPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  constructor(public readonly log: Logger, public readonly config: PlatformConfig, public readonly api: API) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    const uuid = this.api.hap.uuid.generate(PLUGIN_NAME);

    const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);

    const validatedConfig = this.validateConfig(this.config);
    if (!validatedConfig) {
      this.log.error('Invalid Configuration. Please Check Your Config.json');
      return;
    }

    if (existingAccessory) {
      this.log.info('Restoring Existing Accessory from Cache:', existingAccessory.displayName);
      new HueDaylightSyncAccessory(this, existingAccessory, validatedConfig);
    } else {
      this.log.info('Adding New Accessory');
      const accessory = new this.api.platformAccessory('Daylight Sync', uuid);
      new HueDaylightSyncAccessory(this, accessory, validatedConfig);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  private validateConfig(config: PlatformConfig): Config | null {
    if (
      typeof config.bridgeIp !== 'string' ||
      typeof config.apiToken !== 'string' ||
      typeof config.latitude !== 'number' ||
      typeof config.longitude !== 'number'
    ) {
      return null;
    }

    return {
      ...config,
      bridgeIp: config.bridgeIp,
      apiToken: config.apiToken,
      latitude: config.latitude,
      longitude: config.longitude,
      updateInterval: config.updateInterval || 300000,
      warmTemp: config.warmTemp || 2700,
      coolTemp: config.coolTemp || 6500,
      inputDebounceDelay: config.inputDebounceDelay || 750,
      defaultAutoMode: config.defaultAutoMode ?? true,
    };
  }
}
