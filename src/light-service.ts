import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HueDaylightSyncPlatform } from './platform';
import { TemperatureCalculator } from './temperature-calculator';
import { QueueProcessor } from './queue-processor';
import { kelvinToMired, miredToKelvin, mapKelvinToBrightness, mapBrightnessToKelvin } from './utils';

export class LightService {
  private service: Service;
  private isOn = false;
  private currentTemp: number;
  private isUpdating = false;
  private readonly inputDebounceDelay: number;
  private updateTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly platform: HueDaylightSyncPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly temperatureCalculator: TemperatureCalculator,
    private readonly queueProcessor: QueueProcessor,
    inputDebounceDelay?: number,
  ) {
    this.inputDebounceDelay = inputDebounceDelay ?? 750;
    this.currentTemp = this.temperatureCalculator.getWarmTemp();

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Daylight Sync');

    this.service.getCharacteristic(this.platform.Characteristic.On).onSet(this.setOn.bind(this)).onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness).onSet(this.setBrightness.bind(this)).onGet(this.getBrightness.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.ColorTemperature)
      .onSet(this.setColorTemperature.bind(this))
      .onGet(this.getColorTemperature.bind(this))
      .setProps({
        minValue: kelvinToMired(this.temperatureCalculator.getCoolTemp()),
        maxValue: kelvinToMired(this.temperatureCalculator.getWarmTemp()),
        minStep: 1,
      });

    this.updateHomeKitCharacteristics();
  }

  async setOn(value: CharacteristicValue) {
    this.isOn = value as boolean;
    this.platform.log.info('Set Characteristic On ->', value);
    if (this.isOn) {
      this.debounceUpdate(() => this.updateLights(this.currentTemp));
    } else {
      this.updateHomeKitCharacteristics();
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    const brightness = value as number;
    this.platform.log.info('Set Characteristic Brightness -> ', brightness);
    const newTemp = mapBrightnessToKelvin(brightness, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
    this.debounceUpdate(() => this.updateLights(newTemp));
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return mapKelvinToBrightness(this.currentTemp, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
  }

  async setColorTemperature(value: CharacteristicValue) {
    const mired = value as number;
    const kelvin = miredToKelvin(mired);
    this.platform.log.info(`Set Characteristic ColorTemperature -> ${mired} mired (${kelvin}K)`);
    this.debounceUpdate(() => this.updateLights(kelvin));
  }

  async getColorTemperature(): Promise<CharacteristicValue> {
    const mired = kelvinToMired(this.currentTemp);
    this.platform.log.debug(`Current temperature ${this.currentTemp}K mapped to ${mired} mired`);
    return mired;
  }

  getCurrentTemp(): number {
    return this.currentTemp;
  }

  async updateTemperature(newTemp: number) {
    if (newTemp !== this.currentTemp) {
      this.platform.log.info(`Updating temperature from ${this.currentTemp}K to ${newTemp}K`);
      this.debounceUpdate(() => this.updateLights(newTemp));
    }
  }

  private debounceUpdate(updateFn: () => Promise<void>) {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.updateTimeout = setTimeout(async () => {
      await updateFn();
      this.updateTimeout = null;
    }, this.inputDebounceDelay);
  }

  private async updateLights(newTemp: number) {
    this.currentTemp = newTemp;
    this.updateHomeKitCharacteristics();
    if (this.isOn) {
      await this.performUpdate();
    }
  }

  private updateHomeKitCharacteristics() {
    const mired = kelvinToMired(this.currentTemp);
    const brightness = mapKelvinToBrightness(this.currentTemp, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
    this.service.updateCharacteristic(this.platform.Characteristic.ColorTemperature, mired);
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, brightness);
    this.service.updateCharacteristic(this.platform.Characteristic.On, this.isOn);
    this.platform.log.debug(`Updated HomeKit - ColorTemperature: ${mired} mired (${this.currentTemp}K), Brightness: ${brightness}%, On: ${this.isOn}`);
  }

  private async performUpdate(): Promise<void> {
    if (this.isUpdating) {
      this.platform.log.debug('Update already in progress, scheduling another update');
      return;
    }

    this.isUpdating = true;

    try {
      this.platform.log.info(`Updating lights to ${this.currentTemp}K`);
      await this.queueProcessor.updateLightsColor(this.currentTemp);
      this.platform.log.info(`Lights updated to ${this.currentTemp}K`);
      this.updateHomeKitCharacteristics();
    } catch (error) {
      this.platform.log.error('Error updating lights:', error);
    } finally {
      this.isUpdating = false;
    }
  }
}
