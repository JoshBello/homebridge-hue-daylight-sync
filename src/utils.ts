export function kelvinToMired(kelvin: number): number {
  return Math.round(1000000 / kelvin);
}

export function miredToKelvin(mired: number): number {
  return Math.round(1000000 / mired);
}

export function kelvinToSliderPosition(kelvin: number, warmTemp: number, coolTemp: number): number {
  const position = ((kelvin - warmTemp) / (coolTemp - warmTemp)) * 99 + 1; // Maps to 1%-100%
  return Math.round(position);
}

export function sliderPositionToKelvin(position: number, warmTemp: number, coolTemp: number): number {
  const kelvin = warmTemp + ((position - 1) / 99) * (coolTemp - warmTemp); // Adjusted for 1%-100%
  return Math.round(kelvin);
}
