import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HueDaylightSyncPlatform } from './platform';
import { TemperatureCalculator } from './temperature-calculator';
import { QueueProcessor } from './queue-processor';
import { kelvinToMired, miredToKelvin, kelvinToSliderPosition, sliderPositionToKelvin } from './utils';

export class LightService {
  private service: Service;
  private isOn = true;
  private currentTemp: number;
  private isUpdating = false;
  private updateTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly platform: HueDaylightSyncPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly temperatureCalculator: TemperatureCalculator,
    private readonly queueProcessor: QueueProcessor,
    private readonly onManualChange: () => void,
    private readonly inputDebounceDelay: number = 750,
  ) {
    this.currentTemp = this.temperatureCalculator.getWarmTemp();
    this.service = this.setupService();
    this.updateHomeKitCharacteristics();
  }

  private setupService(): Service {
    const service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    service.setCharacteristic(this.platform.Characteristic.Name, 'Daylight Sync');

    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(() => this.isOn);

    service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(() => this.getSliderPosition());

    service
      .getCharacteristic(this.platform.Characteristic.ColorTemperature)
      .onSet(this.setColorTemperature.bind(this))
      .onGet(() => kelvinToMired(this.currentTemp))
      .setProps({
        minValue: kelvinToMired(this.temperatureCalculator.getCoolTemp()),
        maxValue: kelvinToMired(this.temperatureCalculator.getWarmTemp()),
        minStep: 1,
      });

    return service;
  }

  async setOn(value: CharacteristicValue) {
    this.isOn = value as boolean;
    this.platform.log.info('Set Characteristic On ->', value);
    this.updateHomeKitCharacteristics();

    if (this.isOn) {
      this.debounceUpdate(() => this.updateLights(this.currentTemp));
    }
  }

  async setBrightness(value: CharacteristicValue) {
    const sliderPosition = value as number;
    const newTemp = this.getKelvinFromSliderPosition(sliderPosition);
    this.platform.log.info(`Brightness slider set to ${sliderPosition}%, corresponding to ${newTemp}K`);
    this.onManualChange();
    this.debounceUpdate(() => this.updateLights(newTemp));
  }

  async setColorTemperature(value: CharacteristicValue) {
    const mired = value as number;
    const kelvin = miredToKelvin(mired);
    const sliderPosition = this.getSliderPosition(kelvin);
    this.platform.log.info(`Color temperature set to ${kelvin}K, corresponding to ${sliderPosition}% on brightness slider`);
    this.onManualChange();
    this.debounceUpdate(() => this.updateLights(kelvin));
  }

  getCurrentTemp(): number {
    return this.currentTemp;
  }

  async updateTemperature(newTemp: number) {
    const sliderPosition = this.getSliderPosition(newTemp);
    this.platform.log.info(`Updating temperature from ${this.currentTemp}K to ${newTemp}K (${sliderPosition}% on brightness slider)`);
    this.currentTemp = newTemp;
    this.updateHomeKitCharacteristics();
    this.updateBrightnessBasedOnTemperature();
    this.debounceUpdate(() => this.updateLights(newTemp));
  }

  async updateBrightnessBasedOnTemperature() {
    const sliderPosition = this.getSliderPosition();
    this.platform.log.info(`Updating brightness slider to ${sliderPosition}% based on current temperature ${this.currentTemp}K`);
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, sliderPosition);
    this.platform.log.debug(`Brightness characteristic value after update: ${this.service.getCharacteristic(this.platform.Characteristic.Brightness).value}`);
  }

  private getSliderPosition(temp: number = this.currentTemp): number {
    return kelvinToSliderPosition(temp, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
  }

  private getKelvinFromSliderPosition(position: number): number {
    return sliderPositionToKelvin(position, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
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

  private updateHomeKitCharacteristics(service: Service = this.service) {
    const mired = kelvinToMired(this.currentTemp);
    const sliderPosition = this.getSliderPosition();

    service.updateCharacteristic(this.platform.Characteristic.ColorTemperature, mired);
    service.updateCharacteristic(this.platform.Characteristic.Brightness, sliderPosition);
    service.updateCharacteristic(this.platform.Characteristic.On, this.isOn);

    this.platform.log.debug(`Updated HomeKit - ColorTemperature: ${this.currentTemp}K, Brightness Slider: ${sliderPosition}%, On: ${this.isOn}`);
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
