import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HueDaylightSyncPlatform } from './platform';
import { LightService } from './light-service';
import { TemperatureCalculator } from './temperature-calculator';
import { Config } from './types';

export class AutoModeService {
  private service: Service;
  private isAutoMode: boolean;
  private autoUpdateInterval: NodeJS.Timeout | null = null;
  private lightService!: LightService;

  constructor(
    private readonly platform: HueDaylightSyncPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly temperatureCalculator: TemperatureCalculator,
    private readonly config: Config,
  ) {
    this.isAutoMode = config.defaultAutoMode ?? true;
    this.service = this.accessory.getService('Auto Mode') || this.accessory.addService(this.platform.Service.Switch, 'Auto Mode', 'auto-mode');
    this.service.getCharacteristic(this.platform.Characteristic.On).onSet(this.setAutoMode.bind(this)).onGet(this.getAutoMode.bind(this));
  }

  private async initializeAutoMode() {
    this.platform.log.info(`Initializing Auto Mode: ${this.isAutoMode ? 'ON' : 'OFF'}`);
    this.service.updateCharacteristic(this.platform.Characteristic.On, this.isAutoMode);
    if (this.isAutoMode) {
      await this.updateTemperature();
      this.startAutoUpdate();
    } else {
      await this.lightService.updateBrightnessBasedOnTemperature();
    }
  }

  public setLightService(lightService: LightService) {
    this.lightService = lightService;
    this.initializeAutoMode();
  }

  async setAutoMode(value: CharacteristicValue) {
    this.isAutoMode = value as boolean;
    this.platform.log.info('Set Auto Mode ->', value);
    if (this.isAutoMode) {
      await this.updateTemperature();
      this.startAutoUpdate();
    } else {
      this.stopAutoUpdate();
      await this.lightService.updateBrightnessBasedOnTemperature();
    }
  }

  async getAutoMode(): Promise<CharacteristicValue> {
    return this.isAutoMode;
  }

  public disableAutoModeDueToManualChange() {
    if (this.isAutoMode) {
      this.platform.log.info('Manual change detected. Disabling Auto Mode.');
      this.isAutoMode = false;
      this.service.updateCharacteristic(this.platform.Characteristic.On, this.isAutoMode);
      this.stopAutoUpdate();
    }
  }

  private startAutoUpdate() {
    this.stopAutoUpdate();
    this.updateTemperature();
    this.autoUpdateInterval = setInterval(() => {
      this.updateTemperature();
    }, this.temperatureCalculator.getUpdateInterval());
    this.platform.log.debug('Auto update started');
  }

  private stopAutoUpdate() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
      this.platform.log.debug('Auto update stopped');
    }
  }

  private async updateTemperature() {
    if (!this.isAutoMode) {
      return;
    }
    const currentTemp = this.lightService.getCurrentTemp();
    const targetTemp = await this.temperatureCalculator.calculateIdealTemp();
    this.platform.log.info(`Auto Mode Update - Current Temp: ${currentTemp}K, Target Temp: ${targetTemp}K`);
    if (currentTemp !== targetTemp) {
      this.platform.log.info(`Updating temperature from ${currentTemp}K to ${targetTemp}K`);
      await this.lightService.updateTemperature(targetTemp);
    } else {
      this.platform.log.debug(`Temperature remains unchanged at ${currentTemp}K`);
      // Ensure brightness is updated even if temperature hasn't changed
      await this.lightService.updateBrightnessBasedOnTemperature();
    }
  }
}
