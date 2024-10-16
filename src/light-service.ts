import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HueDaylightSyncPlatform } from './platform';
import { TemperatureCalculator } from './temperature-calculator';
import { QueueProcessor } from './queue-processor';
import { mapBrightnessToTemp, mapTempToBrightness } from './utils';

export class LightService {
  private service: Service;
  private isOn = false;
  private currentTemp: number;
  private updateTimeout: NodeJS.Timeout | null = null;
  private updateDelay = 750; // 750 milliseconds delay before updates

  constructor(
    private readonly platform: HueDaylightSyncPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly temperatureCalculator: TemperatureCalculator,
    private readonly queueProcessor: QueueProcessor,
  ) {
    this.currentTemp = this.temperatureCalculator.getWarmTemp();

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Hue Daylight Sync');

    this.service.getCharacteristic(this.platform.Characteristic.On).onSet(this.setOn.bind(this)).onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness).onSet(this.setBrightness.bind(this)).onGet(this.getBrightness.bind(this));
  }

  async setOn(value: CharacteristicValue) {
    this.isOn = value as boolean;
    this.platform.log.info('Set Characteristic On ->', value);
    if (this.isOn) {
      this.scheduleUpdate();
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    const brightness = value as number;
    this.platform.log.info('Set Characteristic Brightness -> ', brightness);
    this.currentTemp = mapBrightnessToTemp(brightness, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
    if (this.isOn) {
      this.scheduleUpdate();
    }
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return mapTempToBrightness(this.currentTemp, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
  }

  getCurrentTemp(): number {
    return this.currentTemp;
  }

  private scheduleUpdate() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.updateTimeout = setTimeout(() => {
      this.updateLightsColor(this.currentTemp);
    }, this.updateDelay);
  }

  private async updateLightsColor(targetTemp: number) {
    await this.queueProcessor.updateLightsColor(targetTemp);
  }

  updateTemperature(newTemp: number) {
    if (this.isOn && newTemp !== this.currentTemp) {
      this.currentTemp = newTemp;
      const brightness = mapTempToBrightness(this.currentTemp, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, brightness);
      this.scheduleUpdate();
    }
  }
}
