export function kelvinToMired(kelvin: number): number {
  return Math.round(1000000 / kelvin);
}

export function miredToKelvin(mired: number): number {
  return Math.round(1000000 / mired);
}

export function mapKelvinToBrightness(kelvin: number, warmTemp: number, coolTemp: number): number {
  return Math.round(((kelvin - warmTemp) / (coolTemp - warmTemp)) * 100);
}

export function mapBrightnessToKelvin(brightness: number, warmTemp: number, coolTemp: number): number {
  return Math.round(warmTemp + (brightness / 100) * (coolTemp - warmTemp));
}
