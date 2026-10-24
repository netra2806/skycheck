/**
 * SKYCHECK - Weather & Geocoding API Client
 * Uses Open-Meteo API (100% Free, No API key required, Global coverage, CORS enabled).
 */

class WeatherAPI {
  constructor() {
    this.forecastBaseUrl = 'https://api.open-meteo.com/v1/forecast';
    this.geocodingBaseUrl = 'https://geocoding-api.open-meteo.com/v1/search';
    this.cache = new Map();
  }

  /**
   * Search for cities matching a query string
   * @param {string} query 
   * @returns {Promise<Array>} List of location objects
   */
  async searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    const trimmed = query.trim();

    try {
      const url = `${this.geocodingBaseUrl}?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Geocoding request failed');
      const data = await response.json();

      if (!data.results || !data.results.length) return [];

      return data.results.map(item => ({
        id: item.id,
        name: item.name,
        country: item.country || '',
        countryCode: item.country_code || '',
        flag: this.countryCodeToFlag(item.country_code),
        admin1: item.admin1 || '',
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone || 'auto'
      }));
    } catch (err) {
      console.warn('Geocoding error:', err);
      return [];
    }
  }

  /**
   * Fetch complete weather data for latitude/longitude
   * @param {number} lat 
   * @param {number} lon 
   * @param {string} timezone 
   */
  async getWeather(lat, lon, timezone = 'auto') {
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const now = Date.now();

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < 10 * 60 * 1000) { // 10 min cache
        return cached.data;
      }
    }

    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'weather_code',
        'cloud_cover',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m'
      ].join(','),
      hourly: [
        'temperature_2m',
        'weather_code',
        'precipitation_probability'
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'sunrise',
        'sunset',
        'uv_index_max',
        'precipitation_probability_max'
      ].join(','),
      timezone: timezone || 'auto'
    });

    const url = `${this.forecastBaseUrl}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather fetch failed: ${response.status}`);
    const data = await response.json();

    const parsedData = this.parseWeatherData(data);
    this.cache.set(cacheKey, { timestamp: now, data: parsedData });
    return parsedData;
  }

  /**
   * Parse Open-Meteo response into structured app state
   */
  parseWeatherData(raw) {
    const cur = raw.current || {};
    const isDay = cur.is_day === 1;
    const weatherCode = cur.weather_code ?? 0;
    const condition = this.mapWeatherCode(weatherCode, isDay);

    // Hourly Forecast (Next 24 hours from current index)
    const hourlyList = [];
    if (raw.hourly && raw.hourly.time) {
      const currentTimeStr = cur.time;
      let startIdx = 0;
      if (currentTimeStr) {
        startIdx = raw.hourly.time.findIndex(t => t >= currentTimeStr);
        if (startIdx === -1) startIdx = 0;
      }

      const count = Math.min(24, raw.hourly.time.length - startIdx);
      for (let i = 0; i < count; i++) {
        const idx = startIdx + i;
        const timeVal = raw.hourly.time[idx];
        const dateObj = new Date(timeVal);
        const hourNumber = dateObj.getHours();
        const code = raw.hourly.weather_code[idx];
        const isHourDay = hourNumber >= 6 && hourNumber < 19;
        const cond = this.mapWeatherCode(code, isHourDay);

        hourlyList.push({
          timeLabel: i === 0 ? 'Now' : `${hourNumber.toString().padStart(2, '0')}:00`,
          tempC: Math.round(raw.hourly.temperature_2m[idx]),
          weatherCode: code,
          icon: cond.icon,
          conditionTitle: cond.title,
          precipProb: raw.hourly.precipitation_probability ? raw.hourly.precipitation_probability[idx] : 0
        });
      }
    }

    // Daily Forecast (Next 7 days)
    const dailyList = [];
    if (raw.daily && raw.daily.time) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < raw.daily.time.length && i < 7; i++) {
        const dateObj = new Date(raw.daily.time[i] + 'T00:00:00');
        const dayName = i === 0 ? 'Today' : days[dateObj.getDay()];
        const code = raw.daily.weather_code[i];
        const cond = this.mapWeatherCode(code, true);

        dailyList.push({
          dayLabel: dayName,
          date: raw.daily.time[i],
          maxTempC: Math.round(raw.daily.temperature_2m_max[i]),
          minTempC: Math.round(raw.daily.temperature_2m_min[i]),
          weatherCode: code,
          icon: cond.icon,
          conditionTitle: cond.title,
          precipProbMax: raw.daily.precipitation_probability_max ? raw.daily.precipitation_probability_max[i] : 0,
          uvIndex: raw.daily.uv_index_max ? raw.daily.uv_index_max[i] : 0,
          sunrise: raw.daily.sunrise ? raw.daily.sunrise[i] : null,
          sunset: raw.daily.sunset ? raw.daily.sunset[i] : null
        });
      }
    }

    // Sunrise & Sunset Formatting
    let sunriseTime = '06:30';
    let sunsetTime = '18:45';
    if (raw.daily && raw.daily.sunrise && raw.daily.sunrise[0]) {
      const srDate = new Date(raw.daily.sunrise[0]);
      sunriseTime = srDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (raw.daily && raw.daily.sunset && raw.daily.sunset[0]) {
      const ssDate = new Date(raw.daily.sunset[0]);
      sunsetTime = ssDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    const windDir = this.degreesToCardinal(cur.wind_direction_10m ?? 0);
    const uvVal = (raw.daily && raw.daily.uv_index_max && raw.daily.uv_index_max[0]) ? Math.round(raw.daily.uv_index_max[0]) : 3;

    return {
      current: {
        tempC: Math.round(cur.temperature_2m ?? 20),
        feelsLikeC: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 20),
        humidity: Math.round(cur.relative_humidity_2m ?? 50),
        windKmh: Math.round(cur.wind_speed_10m ?? 10),
        windDirection: windDir,
        windDeg: cur.wind_direction_10m ?? 0,
        pressureHpa: Math.round(cur.surface_pressure ?? 1013),
        precipitationMm: cur.precipitation ?? 0,
        cloudCoverPct: Math.round(cur.cloud_cover ?? 20),
        uvIndex: uvVal,
        uvCategory: this.getUVCategory(uvVal),
        sunrise: sunriseTime,
        sunset: sunsetTime,
        isDay: isDay,
        weatherCode: weatherCode,
        condition: condition
      },
      hourly: hourlyList,
      daily: dailyList,
      timezone: raw.timezone
    };
  }

  /**
   * Map WMO Weather Interpretation Code to Title, Cartoon Theme, Icon and Description
   */
  mapWeatherCode(code, isDay = true) {
    switch (code) {
      case 0:
        return {
          title: isDay ? 'Clear & Sunny' : 'Clear Starry Night',
          theme: isDay ? 'sunny' : 'night',
          icon: isDay ? '☀️' : '🌙',
          desc: isDay ? 'Glorious bright sunshine! Don’t forget your cool sunglasses! 😎' : 'Stunning clear skies with twinkling stars above! ✨'
        };
      case 1:
        return {
          title: isDay ? 'Mainly Sunny' : 'Mainly Clear Night',
          theme: isDay ? 'sunny' : 'night',
          icon: isDay ? '🌤️' : '🌙',
          desc: isDay ? 'Mostly blue skies with a few friendly cartoon clouds drifting by.' : 'Quiet peaceful night with gentle starlight.'
        };
      case 2:
        return {
          title: 'Partly Cloudy',
          theme: 'cloudy',
          icon: '⛅',
          desc: 'Sun playing hide-and-seek behind fluffy marshmallow clouds.'
        };
      case 3:
        return {
          title: 'Overcast Sky',
          theme: 'cloudy',
          icon: '☁️',
          desc: 'Soft blanket of clouds covering the sky. Cozy sweater weather!'
        };
      case 45:
      case 48:
        return {
          title: 'Misty Fog',
          theme: 'mist',
          icon: '🌫️',
          desc: 'A mysterious fairy-tale mist rolling across the landscape.'
        };
      case 51:
      case 53:
      case 55:
        return {
          title: 'Light Drizzle',
          theme: 'rainy',
          icon: '🌦️',
          desc: 'Gentle sprinkle of raindrops. Perfect for cute puddle hops!'
        };
      case 56:
      case 57:
        return {
          title: 'Freezing Drizzle',
          theme: 'snowy',
          icon: '🌨️',
          desc: 'Chilly frosty droplets tingling in the crisp air.'
        };
      case 61:
      case 63:
      case 65:
        return {
          title: 'Rain Showers',
          theme: 'rainy',
          icon: '🌧️',
          desc: 'Raindrops falling pitter-patter! Grab your bright umbrella!'
        };
      case 66:
      case 67:
        return {
          title: 'Freezing Rain',
          theme: 'snowy',
          icon: '🌨️',
          desc: 'Icy cold rain glistening on the branches.'
        };
      case 71:
      case 73:
      case 75:
      case 77:
        return {
          title: 'Gentle Snowfall',
          theme: 'snowy',
          icon: '❄️',
          desc: 'Fluffy white snowflakes dancing down to build a happy snowman!'
        };
      case 80:
      case 81:
      case 82:
        return {
          title: 'Passing Rain',
          theme: 'rainy',
          icon: '🌧️',
          desc: 'Refreshing cartoon showers washing the green fields.'
        };
      case 85:
      case 86:
        return {
          title: 'Snow Showers',
          theme: 'snowy',
          icon: '🌨️',
          desc: 'Whirling winter snow flurry creating a cartoon winter wonderland!'
        };
      case 95:
        return {
          title: 'Thunderstorm',
          theme: 'thunder',
          icon: '⛈️',
          desc: 'Exciting rumble of thunder and bright lightning sparks in the dark sky!'
        };
      case 96:
      case 99:
        return {
          title: 'Severe Thunderstorm',
          theme: 'thunder',
          icon: '⛈️',
          desc: 'Dramatic lightning flash storm with hail! Cozy up indoors!'
        };
      default:
        return {
          title: isDay ? 'Fair Weather' : 'Quiet Night',
          theme: isDay ? 'sunny' : 'night',
          icon: isDay ? '☀️' : '🌙',
          desc: 'A pleasant and calm day in the neighborhood.'
        };
    }
  }

  degreesToCardinal(deg) {
    const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((deg % 360) / 22.5) % 16;
    return cardinals[index];
  }

  getUVCategory(uv) {
    if (uv <= 2) return { text: 'Low', color: '#22c55e', desc: 'Minimal sun protection required.' };
    if (uv <= 5) return { text: 'Moderate', color: '#eab308', desc: 'Wear sunglasses & hat outdoors.' };
    if (uv <= 7) return { text: 'High', color: '#f97316', desc: 'Cover up and seek shade around noon.' };
    if (uv <= 10) return { text: 'Very High', color: '#ef4444', desc: 'Extra protection needed. Sunscreen up!' };
    return { text: 'Extreme', color: '#8b5cf6', desc: 'Take full precautions to avoid burn.' };
  }

  countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
}

window.WeatherAPI = WeatherAPI;
