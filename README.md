# Hue Daylight Sync

Hue Daylight Sync is a Homebridge plugin that automatically adjusts your Philips Hue lights based on the natural daylight cycle. It calculates the ideal color temperature throughout the day based on your geographical location and smoothly transitions your lights to match.

## Features

- Automatic color temperature adjustment based on time of day
- Customizable warm and cool temperature ranges
- Geolocation-based calculations for accurate sunlight mimicking
- Manual override option with automatic mode switch
- Smooth transitions between color temperatures
- Rate-limiting handling to prevent API abuse

## Prerequisites

- [Homebridge](https://homebridge.io/) installed on your system
- Philips Hue Bridge with API access
- Philips Hue color temperature capable lights

## Installation

1. Install the plugin through Homebridge UI or manually:

```bash
npm install -g homebridge-hue-daylight-sync
```

2. Configure the plugin in your Homebridge `config.json` or through the Homebridge UI.

## Configuration

Add the following to your Homebridge `config.json` file:

```json
{
  "platforms": [
    {
      "platform": "HueDaylightSync",
      "name": "Hue Daylight Sync",
      "bridgeIp": "YOUR_HUE_BRIDGE_IP",
      "apiToken": "YOUR_HUE_API_TOKEN",
      "latitude": YOUR_LATITUDE,
      "longitude": YOUR_LONGITUDE,
      "updateInterval": 300000,
      "warmTemp": 2700,
      "coolTemp": 3000
    }
  ]
}
```

### Configuration Options

- `bridgeIp`: The IP address of your Hue Bridge
- `apiToken`: Your Hue API token
- `latitude`: Your geographical latitude
- `longitude`: Your geographical longitude
- `updateInterval` (optional): Interval in milliseconds between temperature updates (default: 300000 - 5 minutes)
- `warmTemp` (optional): Warmest color temperature in Kelvin (default: 2700K)
- `coolTemp` (optional): Coolest color temperature in Kelvin (default: 3000K)

## Usage

Once installed and configured, the plugin will appear in your Home app as a light accessory with an additional switch for the Auto Mode.

- Toggle the main switch to turn the Daylight Sync on or off.
- Use the brightness slider to manually adjust the color temperature.
- Toggle the Auto Mode switch to enable or disable automatic temperature adjustments.

When Auto Mode is enabled, the plugin will automatically adjust your Hue lights' color temperature throughout the day to match natural daylight patterns.

## Troubleshooting

If you encounter any issues:

1. Check your Homebridge logs for any error messages.
2. Ensure your Hue Bridge IP and API token are correct.
3. Verify that your latitude and longitude are set correctly.
4. Make sure your Hue lights support color temperature adjustments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Homebridge](https://homebridge.io/) for making this integration possible.
- [Philips Hue](https://www.philips-hue.com/) for their smart lighting system and API.