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
    return Math.round(this.warmTemp + (this.coolTemp - this.warmTemp) * transitionFactor);
  }

  private calcTransitionFactor(): number {
    const now = new Date();

    if (!this.latitude || !this.longitude) {
      this.log.error(`Invalid latitude (${this.latitude}) or longitude (${this.longitude})`);
      return 0.5; // Return a default value
    }

    const times = SunCalc.getTimes(now, this.latitude, this.longitude);
    const solarNoon = times.solarNoon;
    const nextSolarNoon = new Date(solarNoon.getTime() + 24 * 60 * 60 * 1000);

    // Calculate the time difference between now and solar noon
    let timeSinceNoon = now.getTime() - solarNoon.getTime();

    // Adjust for the closest solar noon
    if (Math.abs(timeSinceNoon) > 12 * 60 * 60 * 1000) {
      // If more than 12 hours away, use the next or previous solar noon
      timeSinceNoon = now.getTime() - nextSolarNoon.getTime();
    }

    // Calculate the angle for the cosine function
    const angle = (Math.PI * timeSinceNoon) / (12 * 60 * 60 * 1000); // Angle in radians over 24 hours

    // Calculate the transition factor using the cosine function
    const transitionFactor = (1 + Math.cos(angle)) / 2;

    this.log.debug(`Cosine transition factor: ${transitionFactor}`);

    return transitionFactor;
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
