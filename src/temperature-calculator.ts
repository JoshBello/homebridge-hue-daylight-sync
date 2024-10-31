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

    // Current altitude in radians
    const currentAltitude = sunPos.altitude;

    // Before sunrise or after sunset
    if (currentAltitude <= 0) {
      this.log.info(`Night time, altitude: ${currentAltitude.toFixed(4)}, factor: 0`);
      return 0;
    }

    // Normalize current altitude relative to today's maximum possible altitude
    // This ensures we reach 1.0 at solar noon regardless of season
    let transitionFactor = currentAltitude / maxAltitude;

    // Apply the curve exponent to shape the transition
    transitionFactor = Math.pow(transitionFactor, this.curveExponent);

    // Ensure we don't exceed 1.0
    transitionFactor = Math.min(1, transitionFactor);

    const currentAltitudeDegrees = (currentAltitude * 180) / Math.PI;
    const maxAltitudeDegrees = (maxAltitude * 180) / Math.PI;

    this.log.info(
      `Time: ${now.toLocaleTimeString()}\n` +
        `Solar noon: ${solarNoon.toLocaleTimeString()}\n` +
        `Current altitude: ${currentAltitudeDegrees.toFixed(2)}°\n` +
        `Max altitude: ${maxAltitudeDegrees.toFixed(2)}°\n` +
        `Transition factor: ${(transitionFactor * 100).toFixed(1)}%`,
    );

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
