import SunCalc from 'suncalc';
import { Logger } from 'homebridge';
import { Config } from './types';

export class TemperatureCalculator {
  private latitude: number;
  private longitude: number;
  private warmTemp: number;
  private coolTemp: number;
  private updateInterval: number;
  private curveExponent: number;

  constructor(config: Config, private readonly log: Logger) {
    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.warmTemp = config.warmTemp || 2700;
    this.coolTemp = config.coolTemp || 6500;
    this.updateInterval = config.updateInterval || 300000; // 5 minutes
    this.curveExponent = config.curveExponent || 3;
  }

  async calculateIdealTemp(): Promise<number> {
    const transitionFactor = this.calcTransitionFactor();
    return Math.round(this.warmTemp + (this.coolTemp - this.warmTemp) * transitionFactor);
  }

  private calcTransitionFactor(): number {
    const now = new Date();

    if (!this.latitude || !this.longitude) {
      this.log.error(`Invalid latitude (${this.latitude}) or longitude (${this.longitude})`);
      return 0.5; // Default value
    }

    // Get current sun position and times
    const sunPos = SunCalc.getPosition(now, this.latitude, this.longitude);
    const times = SunCalc.getTimes(now, this.latitude, this.longitude);

    // Get the maximum altitude for today
    const solarNoon = times.solarNoon;
    const maxSunPos = SunCalc.getPosition(solarNoon, this.latitude, this.longitude);
    const maxAltitude = maxSunPos.altitude;
    const maxAltitudeDegrees = (maxAltitude * 180) / Math.PI;

    // Current altitude in radians
    const currentAltitude = sunPos.altitude;
    const currentAltitudeDegrees = (currentAltitude * 180) / Math.PI;

    // Before sunrise or after sunset
    if (currentAltitude <= 0) {
      this.log.info('----------------------------------------');
      this.log.info(`Night Time: ${now.toLocaleTimeString()}`);
      this.log.info(`Solar Noon: ${solarNoon.toLocaleTimeString()}`);
      this.log.info(`Current Altitude: ${currentAltitudeDegrees.toFixed(2)}°`);
      this.log.info(`Max Altitude: ${maxAltitudeDegrees.toFixed(2)}°`);
      this.log.info('Transition Factor: 0');
      this.log.info('----------------------------------------');

      return 0;
    }

    // Normalize current altitude relative to today's maximum possible altitude
    // This ensures we reach 1.0 at solar noon regardless of season
    let transitionFactor = currentAltitude / maxAltitude;

    // Apply the curve exponent to shape the transition
    transitionFactor = Math.pow(transitionFactor, this.curveExponent);

    // Ensure we don't exceed 1.0
    transitionFactor = Math.min(1, transitionFactor);

    this.log.info('----------------------------------------');
    this.log.info(`Day Time: ${now.toLocaleTimeString()}`);
    this.log.info(`Solar Noon: ${solarNoon.toLocaleTimeString()}`);
    this.log.info(`Current Altitude: ${currentAltitudeDegrees.toFixed(2)}°`);
    this.log.info(`Max Altitude: ${maxAltitudeDegrees.toFixed(2)}°`);
    this.log.info(`Transition Factor: ${(transitionFactor * 100).toFixed(1)}%`);
    this.log.info('----------------------------------------');

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
