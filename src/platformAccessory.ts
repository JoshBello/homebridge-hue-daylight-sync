import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HueDaylightSyncPlatform } from './platform';
import axios from 'axios';
import https from 'https';
import SunCalc from 'suncalc';

interface QueueItem {
  lightId: string;
  lightName: string;
  kelvin: number;
}

export class HueDaylightSyncAccessory {
  private lightService: Service;
  private autoModeService: Service;
  private currentTemp: number;
  private updateInterval: number;
  private bridgeIp: string;
  private apiToken: string;
  private latitude: number;
  private longitude: number;
  private warmTemp: number;
  private coolTemp: number;
  private autoUpdateInterval: NodeJS.Timeout | null = null;
  private isOn: boolean = false;
  private isAutoMode: boolean = false;
  private updateTimeout: NodeJS.Timeout | null = null;
  private updateDelay: number = 750; // 750 milliseconds delay before updates
  private requestQueue: QueueItem[] = [];
  private isProcessingQueue: boolean = false;

  constructor(private readonly platform: HueDaylightSyncPlatform, private readonly accessory: PlatformAccessory) {
    const config = this.accessory.context.device;
    this.bridgeIp = config.bridgeIp;
    this.apiToken = config.apiToken;
    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.updateInterval = config.updateInterval || 300000; // 5 minutes
    this.warmTemp = config.warmTemp || 2700;
    this.coolTemp = config.coolTemp || 6500;
    this.currentTemp = this.warmTemp;

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Hue Daylight Sync')
      .setCharacteristic(this.platform.Characteristic.Model, 'HDS001')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'HDS001-001');

    // get the Lightbulb service if it exists, otherwise create a new Lightbulb service
    this.lightService = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.lightService.setCharacteristic(this.platform.Characteristic.Name, 'Hue Daylight Sync');

    // Create a switch service for auto mode
    this.autoModeService = this.accessory.getService('Auto Mode') || this.accessory.addService(this.platform.Service.Switch, 'Auto Mode', 'auto-mode');

    // register handlers for the On/Off Characteristic
    this.lightService.getCharacteristic(this.platform.Characteristic.On).onSet(this.setOn.bind(this)).onGet(this.getOn.bind(this));

    // register handlers for the Brightness Characteristic
    this.lightService.getCharacteristic(this.platform.Characteristic.Brightness).onSet(this.setBrightness.bind(this)).onGet(this.getBrightness.bind(this));

    // register handlers for the Auto Mode Switch
    this.autoModeService.getCharacteristic(this.platform.Characteristic.On).onSet(this.setAutoMode.bind(this)).onGet(this.getAutoMode.bind(this));

    // Start processing the queue
    setInterval(() => this.processQueue(), 100);
  }

  async setOn(value: CharacteristicValue) {
    this.isOn = value as boolean;
    this.platform.log.info('Set Characteristic On ->', value);
    if (this.isOn) {
      this.scheduleUpdate();
      if (this.isAutoMode) {
        this.startAutoUpdate();
      }
    } else {
      this.stopAutoUpdate();
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    const brightness = value as number;
    this.platform.log.info('Set Characteristic Brightness -> ', brightness);
    this.currentTemp = this.mapBrightnessToTemp(brightness);
    if (this.isOn) {
      this.scheduleUpdate();
    }
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return this.mapTempToBrightness(this.currentTemp);
  }

  async setAutoMode(value: CharacteristicValue) {
    this.isAutoMode = value as boolean;
    this.platform.log.info('Set Auto Mode ->', value);
    if (this.isAutoMode && this.isOn) {
      this.startAutoUpdate();
    } else {
      this.stopAutoUpdate();
    }
  }

  async getAutoMode(): Promise<CharacteristicValue> {
    return this.isAutoMode;
  }

  private mapBrightnessToTemp(brightness: number): number {
    return Math.round(this.warmTemp + (brightness / 100) * (this.coolTemp - this.warmTemp));
  }

  private mapTempToBrightness(temp: number): number {
    return Math.round(((temp - this.warmTemp) / (this.coolTemp - this.warmTemp)) * 100);
  }

  private startAutoUpdate() {
    this.stopAutoUpdate(); // Clear any existing interval
    this.updateTemperature(); // Update immediately
    this.autoUpdateInterval = setInterval(() => {
      this.updateTemperature();
    }, this.updateInterval);
  }

  private stopAutoUpdate() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
    }
  }

  private async updateTemperature() {
    if (!this.isOn || !this.isAutoMode) {
      return;
    }
    const newTemp = await this.calculateIdealTemp();
    if (newTemp !== this.currentTemp) {
      this.currentTemp = newTemp;
      const brightness = this.mapTempToBrightness(this.currentTemp);
      this.lightService.updateCharacteristic(this.platform.Characteristic.Brightness, brightness);
      this.scheduleUpdate();
    }
  }

  private scheduleUpdate() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.updateTimeout = setTimeout(() => {
      this.updateLightsColor(this.currentTemp);
    }, this.updateDelay);
  }

  private async calculateIdealTemp(): Promise<number> {
    const transitionFactor = this.calcTransitionFactor();
    return Math.round(this.warmTemp + (this.coolTemp - this.warmTemp) * (1 - transitionFactor));
  }

  private calcTransitionFactor(): number {
    const now = new Date();
    this.platform.log.debug(`Current time: ${now.toISOString()}`);

    if (!this.latitude || !this.longitude) {
      this.platform.log.error(`Invalid latitude (${this.latitude}) or longitude (${this.longitude})`);
      return 0.5; // Return a default value
    }

    const times = SunCalc.getTimes(now, this.latitude, this.longitude);
    this.platform.log.debug(`Calculated sun times: ${JSON.stringify(times)}`);

    const dawn = times.dawn;
    const sunrise = times.sunrise;
    const sunset = times.sunset;
    const dusk = times.dusk;

    // Check if any of the calculated times are invalid
    if (!dawn || !sunrise || !sunset || !dusk) {
      this.platform.log.error('Invalid sun times calculated');
      return 0.5; // Return a default value
    }

    this.platform.log.debug(`Dawn: ${dawn.toISOString()}, Sunrise: ${sunrise.toISOString()}, Sunset: ${sunset.toISOString()}, Dusk: ${dusk.toISOString()}`);

    if (now <= dawn || now >= dusk) {
      return 1.0;
    }
    if (now >= sunrise && now <= sunset) {
      return 0.0;
    }
    if (now < sunrise) {
      const factor = 1.0 - (now.getTime() - dawn.getTime()) / (sunrise.getTime() - dawn.getTime());
      this.platform.log.debug(`Morning transition factor: ${factor}`);
      return factor;
    }
    const factor = (now.getTime() - sunset.getTime()) / (dusk.getTime() - sunset.getTime());
    this.platform.log.debug(`Evening transition factor: ${factor}`);
    return factor;
  }

  private async updateLightsColor(targetTemp: number) {
    if (!this.bridgeIp) {
      this.platform.log.error('Cannot update lights: Hue Bridge IP is not set');
      return;
    }

    const url = `https://${this.bridgeIp}/clip/v2/resource/light`;
    const headers = { 'hue-application-key': this.apiToken };

    try {
      const response = await axios.get(url, {
        headers,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      if (response.status === 200) {
        const lights = response.data.data as Record<string, unknown>[];
        for (const light of lights) {
          const lightId = light.id as string;
          const lightName = ((light.metadata as Record<string, unknown>)?.name as string) || 'Unknown';
          this.queueLightUpdate(lightId, lightName, targetTemp);
        }
      } else {
        this.platform.log.error(`Failed to get lights: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.platform.log.error(`Error fetching lights: ${error.message}`);
      } else {
        this.platform.log.error('Unknown error fetching lights');
      }
    }
  }

  private queueLightUpdate(lightId: string, lightName: string, kelvin: number) {
    this.requestQueue.push({ lightId, lightName, kelvin });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const item = this.requestQueue.shift();

    if (item) {
      try {
        await this.changeLightSettings(item.lightId, item.lightName, item.kelvin);
      } catch (error) {
        this.platform.log.error(`Error processing queue item: ${error}`);
        // Optionally, re-queue the failed item
        // this.requestQueue.unshift(item);
      }
    }

    this.isProcessingQueue = false;
  }

  private async changeLightSettings(lightId: string, lightName: string, kelvin: number) {
    const url = `https://${this.bridgeIp}/clip/v2/resource/light/${lightId}`;
    const headers = { 'hue-application-key': this.apiToken };
    const mirek = Math.round(1000000 / kelvin);

    const data = { color_temperature: { mirek } };

    try {
      const response = await axios.put(url, data, {
        headers,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });
      if (response.status === 200) {
        this.platform.log.info(`${lightName} has been updated to ${kelvin}K`);
        this.currentTemp = kelvin;
      } else {
        this.platform.log.error(`Failed to change ${lightName}: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        this.platform.log.warn(`Rate limit hit for ${lightName}, re-queueing`);
        this.queueLightUpdate(lightId, lightName, kelvin);
      } else if (error instanceof Error) {
        this.platform.log.error(`Error updating ${lightName}: ${error.message}`);
      } else {
        this.platform.log.error(`Unknown error updating ${lightName}`);
      }
    }
  }
}
