import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HueDaylightSyncPlatform } from './platform';
import { TemperatureCalculator } from './temperature-calculator';
import { QueueProcessor } from './queue-processor';
import { mapBrightnessToTemp, mapTempToBrightness } from './utils';

export class LightService {
  private service: Service;
  private isOn = false;
  private currentTemp: number;
  private targetTemp: number;
  private updateTimeout: NodeJS.Timeout | null = null;
  private inputDebounceDelay = 1000; // 1 seconds delay for user input
  private isUpdating = false;
  private isInitialized = false;

  constructor(
    private readonly platform: HueDaylightSyncPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly temperatureCalculator: TemperatureCalculator,
    private readonly queueProcessor: QueueProcessor,
  ) {
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Daylight Sync');

    // Initialize temperatures
    this.currentTemp = this.temperatureCalculator.getWarmTemp();
    this.targetTemp = this.currentTemp;

    // Setup characteristics
    this.setupCharacteristics();

    // Initialize the service
    this.initialize();
  }

  private setupCharacteristics() {
    this.service.getCharacteristic(this.platform.Characteristic.On).onSet(this.setOn.bind(this)).onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness).onSet(this.setBrightness.bind(this)).onGet(this.getBrightness.bind(this));
  }

  private async initialize() {
    try {
      const initialState = await this.queueProcessor.getLightState();
      this.isOn = initialState.isOn;
      this.currentTemp = initialState.temperature;
      this.targetTemp = this.currentTemp;

      this.updateBrightnessFromTemp(this.currentTemp);
      this.service.updateCharacteristic(this.platform.Characteristic.On, this.isOn);

      this.platform.log.info(`Initialized light state - On: ${this.isOn}, Temperature: ${this.currentTemp}K`);
      this.isInitialized = true;
    } catch (error) {
      this.platform.log.error('Error initializing light service:', error);
    }
  }

  private updateBrightnessFromTemp(temp: number) {
    const brightness = mapTempToBrightness(temp, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, brightness);
    this.platform.log.debug(`Updated brightness to ${brightness} based on temperature ${temp}K`);
  }

  async setOn(value: CharacteristicValue) {
    this.isOn = value as boolean;
    this.platform.log.info('Set Characteristic On ->', value);
    if (this.isOn) {
      this.debounceUpdate();
    } else {
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
      }
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    const brightness = value as number;
    this.platform.log.info('Set Characteristic Brightness -> ', brightness);
    this.targetTemp = mapBrightnessToTemp(brightness, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
    this.platform.log.debug(`Target temperature set to ${this.targetTemp}K`);
    if (this.isOn) {
      this.debounceUpdate();
    }
  }

  async getBrightness(): Promise<CharacteristicValue> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return mapTempToBrightness(this.currentTemp, this.temperatureCalculator.getWarmTemp(), this.temperatureCalculator.getCoolTemp());
  }

  getCurrentTemp(): number {
    return this.currentTemp;
  }

  async updateTemperature(newTemp: number) {
    this.targetTemp = newTemp;
    this.platform.log.debug(`Target temperature set to ${this.targetTemp}K from auto mode`);
    if (this.isOn) {
      this.debounceUpdate();
    }
    this.updateBrightnessFromTemp(newTemp);
  }

  private debounceUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      this.performUpdate();
    }, this.inputDebounceDelay);
  }

  private async performUpdate(): Promise<void> {
    if (this.isUpdating) {
      this.platform.log.debug('Update already in progress, scheduling another update');
      this.debounceUpdate();
      return;
    }

    this.isUpdating = true;

    try {
      if (this.currentTemp !== this.targetTemp) {
        this.currentTemp = this.targetTemp;
        this.platform.log.info(`Updating lights to ${this.currentTemp}K`);
        await this.queueProcessor.updateLightsColor(this.currentTemp);
        this.platform.log.info(`Lights updated to ${this.currentTemp}K`);
        this.updateBrightnessFromTemp(this.currentTemp);
      } else {
        this.platform.log.debug(`No update needed, current temp: ${this.currentTemp}K`);
      }
    } catch (error) {
      this.platform.log.error('Error updating lights:', error);
    } finally {
      this.isUpdating = false;
    }
  }
}
