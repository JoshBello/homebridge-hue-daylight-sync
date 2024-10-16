export function mapBrightnessToTemp(brightness: number, warmTemp: number, coolTemp: number): number {
  return Math.round(warmTemp + (brightness / 100) * (coolTemp - warmTemp));
}

export function mapTempToBrightness(temp: number, warmTemp: number, coolTemp: number): number {
  return Math.round(((temp - warmTemp) / (coolTemp - warmTemp)) * 100);
}
