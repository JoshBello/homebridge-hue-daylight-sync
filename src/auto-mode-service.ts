import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HueDaylightSyncPlatform } from './platform';
import { LightService } from './light-service';
import { TemperatureCalculator } from './temperature-calculator';

export class AutoModeService {
  private service: Service;
  private isAutoMode = false;
  private autoUpdateInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly platform: HueDaylightSyncPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly lightService: LightService,
    private readonly temperatureCalculator: TemperatureCalculator,
  ) {
    this.service = this.accessory.getService('Auto Mode') || this.accessory.addService(this.platform.Service.Switch, 'Auto Mode', 'auto-mode');

    this.service.getCharacteristic(this.platform.Characteristic.On).onSet(this.setAutoMode.bind(this)).onGet(this.getAutoMode.bind(this));
  }

  async setAutoMode(value: CharacteristicValue) {
    this.isAutoMode = value as boolean;
    this.platform.log.info('Set Auto Mode ->', value);
    if (this.isAutoMode) {
      await this.updateTemperature(); // Immediate update when auto mode is enabled
      this.startAutoUpdate();
    } else {
      this.stopAutoUpdate();
    }
  }

  async getAutoMode(): Promise<CharacteristicValue> {
    return this.isAutoMode;
  }

  private startAutoUpdate() {
    this.stopAutoUpdate(); // Clear any existing interval
    this.autoUpdateInterval = setInterval(() => {
      this.updateTemperature();
    }, this.temperatureCalculator.getUpdateInterval());
  }

  private stopAutoUpdate() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
    }
  }

  private async updateTemperature() {
    const currentTemp = this.lightService.getCurrentTemp();
    const targetTemp = await this.temperatureCalculator.calculateIdealTemp();

    this.platform.log.info(`Auto Mode Update - Current Temp: ${currentTemp}K, Target Temp: ${targetTemp}K`);

    if (currentTemp !== targetTemp) {
      this.platform.log.info(`Scheduling temperature update from ${currentTemp}K to ${targetTemp}K`);
      await this.lightService.updateTemperature(targetTemp);
    } else {
      this.platform.log.debug(`Temperature remains unchanged at ${currentTemp}K`);
    }
  }
}
