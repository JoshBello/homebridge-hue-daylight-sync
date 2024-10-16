import SunCalc from 'suncalc';
import { Logger } from 'homebridge';
import { Config } from './types';

export class TemperatureCalculator {
  private latitude: number;
  private longitude: number;
  private warmTemp: number;
  private coolTemp: number;
  private updateInterval: number;

  constructor(config: Config, private readonly log: Logger) {
    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.warmTemp = config.warmTemp || 2700;
    this.coolTemp = config.coolTemp || 3000;
    this.updateInterval = config.updateInterval || 300000; // 5 minutes
  }

  async calculateIdealTemp(): Promise<number> {
    const transitionFactor = this.calcTransitionFactor();
    return Math.round(this.warmTemp + (this.coolTemp - this.warmTemp) * (1 - transitionFactor));
  }

  private calcTransitionFactor(): number {
    const now = new Date();
    this.log.debug(`Current time: ${now.toISOString()}`);

    if (!this.latitude || !this.longitude) {
      this.log.error(`Invalid latitude (${this.latitude}) or longitude (${this.longitude})`);
      return 0.5; // Return a default value
    }

    const times = SunCalc.getTimes(now, this.latitude, this.longitude);
    this.log.debug(`Calculated sun times: ${JSON.stringify(times)}`);

    const { dawn, sunrise, sunset, dusk } = times;

    // Check if any of the calculated times are invalid
    if (!dawn || !sunrise || !sunset || !dusk) {
      this.log.error('Invalid sun times calculated');
      return 0.5; // Return a default value
    }

    this.log.debug(`Dawn: ${dawn.toISOString()}, Sunrise: ${sunrise.toISOString()}, Sunset: ${sunset.toISOString()}, Dusk: ${dusk.toISOString()}`);

    if (now <= dawn || now >= dusk) {
      return 1.0;
    }
    if (now >= sunrise && now <= sunset) {
      return 0.0;
    }
    if (now < sunrise) {
      const factor = 1.0 - (now.getTime() - dawn.getTime()) / (sunrise.getTime() - dawn.getTime());
      this.log.debug(`Morning transition factor: ${factor}`);
      return factor;
    }
    const factor = (now.getTime() - sunset.getTime()) / (dusk.getTime() - sunset.getTime());
    this.log.debug(`Evening transition factor: ${factor}`);
    return factor;
  }

  getWarmTemp(): number {
    return this.warmTemp;
  }

  getCoolTemp(): number {
    return this.coolTemp;
  }

  getUpdateInterval(): number {
    return this.updateInterval;
  }
}
