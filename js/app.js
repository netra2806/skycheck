/**
 * SKYCHECK - Main Application Controller
 * Coordinates UI, User Events, Real-time API Updates, and Area Recommendation Bar.
 * Static cartoon background pictures and forward-positioned area recommendations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Theme & API Instances
  const themeController = new WeatherThemeController();
  const api = new WeatherAPI();

  // Preset Recommended Areas Map
  const cityPresetMap = {
    'Tokyo': { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
    'New York': { name: 'New York', country: 'United States', flag: '🇺🇸', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
    'London': { name: 'London', country: 'United Kingdom', flag: '🇬🇧', latitude: 51.5085, longitude: -0.1257, timezone: 'Europe/London' },
    'Paris': { name: 'Paris', country: 'France', flag: '🇫🇷', latitude: 48.8534, longitude: 2.3488, timezone: 'Europe/Paris' },
    'Sydney': { name: 'Sydney', country: 'Australia', flag: '🇦🇺', latitude: -33.8678, longitude: 151.2073, timezone: 'Australia/Sydney' },
    'Mumbai': { name: 'Mumbai', country: 'India', flag: '🇮🇳', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
    'Dubai': { name: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
    'Singapore': { name: 'Singapore', country: 'Singapore', flag: '🇸🇬', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
    'Reykjavik': { name: 'Reykjavik', country: 'Iceland', flag: '🇮🇸', latitude: 64.1355, longitude: -21.8954, timezone: 'Atlantic/Reykjavik' },
    'Honolulu': { name: 'Honolulu', country: 'United States', flag: '🇺🇸', latitude: 21.3069, longitude: -157.8583, timezone: 'Pacific/Honolulu' }
  };

  // Application State
  const state = {
    unit: localStorage.getItem('skycheck_unit') || 'C', // 'C' or 'F'
    currentCity: cityPresetMap['Tokyo'],
    weatherData: null
  };

  // DOM Elements
  const searchInput = document.getElementById('city-search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const autocompleteDropdown = document.getElementById('autocomplete-dropdown');
  const locateBtn = document.getElementById('btn-locate');
  const unitToggleBtn = document.getElementById('btn-toggle-unit');
  const quickCityChips = document.querySelectorAll('.city-chip');
  const toastEl = document.getElementById('toast-notification');

  // Hero Card Elements
  const elCityTitle = document.getElementById('hero-city-name');
  const elCountryFlag = document.getElementById('hero-country-flag');
  const elLocalTime = document.getElementById('hero-local-time');
  const elTempNum = document.getElementById('hero-temp-value');
  const elTempUnit = document.getElementById('hero-temp-unit');
  const elConditionTitle = document.getElementById('hero-condition-title');
  const elConditionDesc = document.getElementById('hero-condition-desc');
  const elConditionBadge = document.getElementById('hero-condition-badge');
  const elFeelsLike = document.getElementById('stat-feels-like');
  const elHighLow = document.getElementById('stat-high-low');
  const elWindStat = document.getElementById('stat-wind-hero');

  // Forecast & Bento Elements
  const hourlyStrip = document.getElementById('hourly-forecast-strip');
  const weeklyList = document.getElementById('weekly-forecast-list');
  const elHumidityVal = document.getElementById('bento-humidity-val');
  const elHumiditySub = document.getElementById('bento-humidity-sub');
  const elWindVal = document.getElementById('bento-wind-val');
  const elWindSub = document.getElementById('bento-wind-sub');
  const elUvVal = document.getElementById('bento-uv-val');
  const elUvBadge = document.getElementById('bento-uv-badge');
  const elUvThumb = document.getElementById('uv-gauge-thumb');
  const elPressureVal = document.getElementById('bento-pressure-val');
  const elPrecipVal = document.getElementById('bento-precip-val');
  const elSunriseTime = document.getElementById('time-sunrise');
  const elSunsetTime = document.getElementById('time-sunset');
  const elSunArchDot = document.getElementById('sun-path-dot');

  // --------------------------------------------------------------------------
  // Fetch & Render Weather Flow
  // --------------------------------------------------------------------------
  async function loadWeatherForCity(cityObj) {
    state.currentCity = cityObj;

    showLoadingState(true);

    try {
      const data = await api.getWeather(cityObj.latitude, cityObj.longitude, cityObj.timezone);
      state.weatherData = data;
      renderAll(data);
      themeController.setWeather(data.current.condition.theme);
      showToast(`Loaded live weather for ${cityObj.name} ${cityObj.flag}`);
    } catch (err) {
      console.error('Error fetching weather:', err);
      showToast('⚠️ Could not load weather. Trying cached/offline mode...');
    } finally {
      showLoadingState(false);
    }
  }

  function renderAll(data) {
    if (!data) return;
    renderHero(data);
    renderHourly(data.hourly);
    renderWeekly(data.daily);
    renderBento(data.current);
    updateClock(data.timezone);
  }

  function renderHero(data) {
    const cur = data.current;
    elCityTitle.textContent = state.currentCity.name;
    elCountryFlag.textContent = state.currentCity.flag;
    elConditionTitle.textContent = cur.condition.title;
    elConditionDesc.textContent = cur.condition.desc;
    elConditionBadge.textContent = `${cur.condition.icon} ${cur.condition.title}`;

    const tempFormatted = formatTemp(cur.tempC);
    elTempNum.textContent = tempFormatted;
    elTempUnit.textContent = `°${state.unit}`;

    const feelsFormatted = formatTemp(cur.feelsLikeC);
    elFeelsLike.textContent = `${feelsFormatted}°${state.unit}`;

    if (data.daily && data.daily.length > 0) {
      const today = data.daily[0];
      elHighLow.textContent = `H: ${formatTemp(today.maxTempC)}° / L: ${formatTemp(today.minTempC)}°`;
    }

    const windSpeedFormatted = state.unit === 'F' ? `${Math.round(cur.windKmh * 0.621)} mph` : `${cur.windKmh} km/h`;
    elWindStat.textContent = `${windSpeedFormatted} ${cur.windDirection}`;
  }

  function renderHourly(hourlyList) {
    if (!hourlyStrip) return;
    hourlyStrip.innerHTML = '';

    if (!hourlyList || !hourlyList.length) {
      hourlyStrip.innerHTML = '<div style="padding:10px;color:var(--text-muted)">Hourly forecast unavailable</div>';
      return;
    }

    hourlyList.forEach((h, idx) => {
      const item = document.createElement('div');
      item.className = `hour-item ${idx === 0 ? 'now' : ''}`;
      item.innerHTML = `
        <span class="hour-time">${h.timeLabel}</span>
        <span class="hour-icon">${h.icon}</span>
        <span class="hour-temp">${formatTemp(h.tempC)}°</span>
        ${h.precipProb > 10 ? `<span class="hour-rain">💧${h.precipProb}%</span>` : '<span style="font-size:11px;opacity:0.4;">—</span>'}
      `;
      hourlyStrip.appendChild(item);
    });
  }

  function renderWeekly(dailyList) {
    if (!weeklyList) return;
    weeklyList.innerHTML = '';

    if (!dailyList || !dailyList.length) {
      weeklyList.innerHTML = '<div style="padding:10px;color:var(--text-muted)">Daily forecast unavailable</div>';
      return;
    }

    let minAll = 100;
    let maxAll = -100;
    dailyList.forEach(d => {
      if (d.minTempC < minAll) minAll = d.minTempC;
      if (d.maxTempC > maxAll) maxAll = d.maxTempC;
    });
    const rangeSpan = Math.max(1, maxAll - minAll);

    dailyList.forEach((d, idx) => {
      const leftPct = Math.max(0, ((d.minTempC - minAll) / rangeSpan) * 100);
      const widthPct = Math.max(12, ((d.maxTempC - d.minTempC) / rangeSpan) * 100);

      const row = document.createElement('div');
      row.className = 'weekly-item';
      row.innerHTML = `
        <span class="weekly-day ${idx === 0 ? 'today' : ''}">${d.dayLabel}</span>
        <span class="weekly-icon">${d.icon}</span>
        <div class="temp-bar-container">
          <div class="temp-bar-track">
            <div class="temp-bar-fill" style="left: ${leftPct}%; width: ${widthPct}%;"></div>
          </div>
        </div>
        <div class="weekly-temps">
          <span class="high">${formatTemp(d.maxTempC)}°</span>
          <span class="low">${formatTemp(d.minTempC)}°</span>
        </div>
      `;
      weeklyList.appendChild(row);
    });
  }

  function renderBento(cur) {
    // Humidity
    elHumidityVal.textContent = `${cur.humidity}%`;
    if (cur.humidity < 40) elHumiditySub.textContent = '🌵 Crisp & Dry';
    else if (cur.humidity < 70) elHumiditySub.textContent = '✨ Pleasant & Comfortable';
    else elHumiditySub.textContent = '💧 Muggy & Humid';

    // Wind
    const windSpeedFormatted = state.unit === 'F' ? `${Math.round(cur.windKmh * 0.621)} mph` : `${cur.windKmh} km/h`;
    elWindVal.textContent = windSpeedFormatted;
    elWindSub.textContent = `Heading from ${cur.windDirection} (${cur.windDeg}°)`;

    // UV Index
    elUvVal.textContent = cur.uvIndex;
    elUvBadge.textContent = cur.uvCategory.text;
    elUvBadge.style.color = cur.uvCategory.color;
    const uvPercent = Math.min(100, (cur.uvIndex / 11) * 100);
    if (elUvThumb) elUvThumb.style.left = `${uvPercent}%`;

    // Pressure & Precipitation
    elPressureVal.textContent = `${cur.pressureHpa} hPa`;
    elPrecipVal.textContent = `${cur.precipitationMm} mm`;

    // Sunrise & Sunset
    elSunriseTime.textContent = cur.sunrise;
    elSunsetTime.textContent = cur.sunset;

    // Sun Path Arc Position
    updateSunPositionOnArc(cur.sunrise, cur.sunset);
  }

  function updateSunPositionOnArc(sunriseStr, sunsetStr) {
    if (!elSunArchDot) return;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [srH, srM] = (sunriseStr || '06:00').split(':').map(Number);
    const [ssH, ssM] = (sunsetStr || '18:00').split(':').map(Number);
    const riseMins = srH * 60 + srM;
    const setMins = ssH * 60 + ssM;

    let progress = (currentMins - riseMins) / (setMins - riseMins);
    progress = Math.max(0, Math.min(1, progress));

    const t = progress;
    const p0 = { x: 20, y: 60 };
    const p1 = { x: 120, y: 5 };
    const p2 = { x: 220, y: 60 };

    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

    elSunArchDot.setAttribute('cx', x);
    elSunArchDot.setAttribute('cy', y);
  }

  function formatTemp(celsius) {
    if (state.unit === 'F') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  }

  let clockInterval = null;
  function updateClock(timezone) {
    if (clockInterval) clearInterval(clockInterval);

    const tick = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {
          timeZone: timezone || undefined,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        elLocalTime.innerHTML = `<span>🕒</span> ${timeStr}`;
      } catch (e) {
        elLocalTime.innerHTML = `<span>🕒</span> Live`;
      }
    };

    tick();
    clockInterval = setInterval(tick, 1000);
  }

  function showLoadingState(isLoading) {
    if (isLoading) {
      elCityTitle.classList.add('loading-state');
      elTempNum.classList.add('loading-state');
    } else {
      elCityTitle.classList.remove('loading-state');
      elTempNum.classList.remove('loading-state');
    }
  }

  // --------------------------------------------------------------------------
  // Search & Recommendations Dropdown Events (Brought to the Front)
  // --------------------------------------------------------------------------
  let searchDebounceTimer = null;
  let activeSearchItems = [];
  let selectedDropdownIndex = -1;

  // On Focus: immediately show recommended areas
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length === 0) {
      renderRecommendedDropdown();
    }
  });

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length > 0) {
      searchClearBtn.classList.add('show');
    } else {
      searchClearBtn.classList.remove('show');
      renderRecommendedDropdown();
      return;
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
      if (val.length < 2) return;
      const results = await api.searchCities(val);
      renderAutocomplete(results);
    }, 220);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (!autocompleteDropdown.classList.contains('open')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedDropdownIndex = Math.min(selectedDropdownIndex + 1, activeSearchItems.length - 1);
      highlightDropdownItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedDropdownIndex = Math.max(selectedDropdownIndex - 1, 0);
      highlightDropdownItem();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedDropdownIndex >= 0 && selectedDropdownIndex < activeSearchItems.length) {
        selectCity(activeSearchItems[selectedDropdownIndex]);
      } else if (activeSearchItems.length > 0) {
        selectCity(activeSearchItems[0]);
      }
    } else if (e.key === 'Escape') {
      closeAutocomplete();
    }
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.classList.remove('show');
    renderRecommendedDropdown();
    searchInput.focus();
  });

  function renderRecommendedDropdown() {
    const recommendedList = Object.values(cityPresetMap);
    activeSearchItems = recommendedList;
    selectedDropdownIndex = -1;
    autocompleteDropdown.innerHTML = `
      <div style="padding: 6px 12px 4px; font-size: 11px; font-weight: 800; color: var(--accent-color); text-transform: uppercase; letter-spacing: 0.6px; display:flex; align-items:center; gap:4px;">
        ⭐ Recommended Areas
      </div>
    `;

    recommendedList.forEach((c, idx) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.setAttribute('data-idx', idx);
      item.innerHTML = `
        <div class="city-name">
          <span>${c.flag}</span>
          <span>${c.name}</span>
        </div>
        <span class="country-name">${c.country}</span>
      `;
      item.addEventListener('click', () => selectCity(c));
      autocompleteDropdown.appendChild(item);
    });

    autocompleteDropdown.classList.add('open');
  }

  function renderAutocomplete(cities) {
    activeSearchItems = cities;
    selectedDropdownIndex = -1;
    autocompleteDropdown.innerHTML = `
      <div style="padding: 6px 12px 4px; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px;">
        Matching Areas
      </div>
    `;

    if (!cities.length) {
      autocompleteDropdown.innerHTML = '<div style="padding:12px;font-size:13px;color:var(--text-muted);text-align:center;">No matching areas found. Try another spelling!</div>';
      autocompleteDropdown.classList.add('open');
      return;
    }

    cities.forEach((c, idx) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.setAttribute('data-idx', idx);
      item.innerHTML = `
        <div class="city-name">
          <span>${c.flag}</span>
          <span>${c.name}${c.admin1 ? `, ${c.admin1}` : ''}</span>
        </div>
        <span class="country-name">${c.country}</span>
      `;
      item.addEventListener('click', () => selectCity(c));
      autocompleteDropdown.appendChild(item);
    });

    autocompleteDropdown.classList.add('open');
  }

  function highlightDropdownItem() {
    const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
    items.forEach((it, idx) => {
      if (idx === selectedDropdownIndex) {
        it.classList.add('active');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('active');
      }
    });
  }

  function selectCity(city) {
    searchInput.value = `${city.name}, ${city.country}`;
    closeAutocomplete();
    loadWeatherForCity(city);
  }

  function closeAutocomplete() {
    autocompleteDropdown.classList.remove('open');
    selectedDropdownIndex = -1;
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section')) {
      closeAutocomplete();
    }
  });

  // --------------------------------------------------------------------------
  // Geolocation "Locate Me" Button
  // --------------------------------------------------------------------------
  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Geolocation not supported by your browser.');
      return;
    }

    showToast('🔍 Detecting your current coordinates...');
    locateBtn.style.opacity = '0.7';

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        locateBtn.style.opacity = '1';
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const myLoc = {
          name: 'My Location',
          country: '',
          flag: '📍',
          admin1: '',
          latitude: lat,
          longitude: lon,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
        };

        searchInput.value = 'My Location';
        loadWeatherForCity(myLoc);
      },
      (err) => {
        locateBtn.style.opacity = '1';
        showToast('⚠️ Could not get location. Permission denied or unavailable.');
        console.warn(err);
      },
      { timeout: 8000 }
    );
  });

  // --------------------------------------------------------------------------
  // Recommended Areas Chips (Brought Forward to Front)
  // --------------------------------------------------------------------------
  quickCityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cityName = chip.getAttribute('data-city');
      const preset = cityPresetMap[cityName];
      if (preset) {
        searchInput.value = `${preset.name}, ${preset.country}`;
        loadWeatherForCity(preset);
      }
    });
  });



  // --------------------------------------------------------------------------
  // Units Toggle (°C / °F)
  // --------------------------------------------------------------------------
  unitToggleBtn.addEventListener('click', () => {
    state.unit = state.unit === 'C' ? 'F' : 'C';
    localStorage.setItem('skycheck_unit', state.unit);
    unitToggleBtn.innerHTML = `<span>🌡️</span> °${state.unit}`;

    if (state.weatherData) {
      renderAll(state.weatherData);
    }
    showToast(`Switched units to °${state.unit}`);
  });

  // --------------------------------------------------------------------------
  // Toast Helper
  // --------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // Initial Boot
  // --------------------------------------------------------------------------
  unitToggleBtn.innerHTML = `<span>🌡️</span> °${state.unit}`;
  loadWeatherForCity(state.currentCity);
});
