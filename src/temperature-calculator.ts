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
    this.coolTemp = config.coolTemp || 6500;
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

    const sunPos = SunCalc.getPosition(now, this.latitude, this.longitude);
    const altitude = sunPos.altitude; // Altitude in radians, from -π/2 to π/2

    // Normalize the altitude to a value between 0 and 1
    const normalizedAltitude = Math.max(0, Math.sin(altitude));

    // Apply an exponent to adjust the steepness of the curve
    const exponent = 3; // Adjust this value to change the steepness
    const transitionFactor = Math.pow(normalizedAltitude, exponent);

    this.log.debug(`Sun altitude: ${altitude.toFixed(4)} radians, Transition factor: ${transitionFactor.toFixed(4)}`);

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
