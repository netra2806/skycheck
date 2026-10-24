/**
 * SKYCHECK - Cartoon Weather Background & Theme Controller
 * Static Cartoon Pictures and Mascot Illustrations (No continuous animations).
 * Updates background image matching weather (sunny, rainy, cloudy, thunder, snowy, night)
 * and renders high-definition cartoon mascot portraits.
 */

class WeatherThemeController {
  constructor() {
    this.bgLayer = document.getElementById('bg-picture-layer');
    this.mascotContainer = document.getElementById('mascot-avatar-slot');
    this.currentWeather = 'sunny';

    this.bgMap = {
      sunny: 'assets/images/sunny.jpg',
      rainy: 'assets/images/rainy.jpg',
      cloudy: 'assets/images/cloudy.jpg',
      thunder: 'assets/images/thunder.jpg',
      snowy: 'assets/images/snowy.jpg',
      night: 'assets/images/night.jpg',
      mist: 'assets/images/cloudy.jpg'
    };
  }

  /**
   * Set active weather theme & background picture
   * @param {string} weatherType - sunny | rainy | cloudy | thunder | snowy | mist | night
   */
  setWeather(weatherType) {
    this.currentWeather = weatherType || 'sunny';

    // 1. Update Body Theme Class for tailored colors & glass styling
    document.body.className = `theme-${this.currentWeather}`;

    // 2. Update Static Cartoon Background Picture
    if (this.bgLayer) {
      const imgPath = this.bgMap[this.currentWeather] || this.bgMap.sunny;
      this.bgLayer.style.backgroundImage = `url('${imgPath}')`;
    }

    // 3. Render Static Cartoon Mascot Portrait
    this.renderMascot();
  }

  /**
   * Static Cartoon Mascot Badge
   */
  renderMascot() {
    if (!this.mascotContainer) return;

    let mascotHTML = '';
    const mood = this.currentWeather;

    switch (mood) {
      case 'sunny':
        mascotHTML = `
          <div class="mascot-avatar mascot-static" title="Sunny SkyPal">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <!-- Sun Rays (Static) -->
              <g fill="#ffb300" opacity="0.85">
                <polygon points="50,4 55,18 45,18" />
                <polygon points="50,96 55,82 45,82" />
                <polygon points="4,50 18,55 18,45" />
                <polygon points="96,50 82,55 82,45" />
                <polygon points="17,17 31,24 24,31" />
                <polygon points="83,83 69,76 76,69" />
                <polygon points="83,17 76,31 69,24" />
                <polygon points="17,83 24,69 31,76" />
              </g>
              <!-- Sun Face Body -->
              <circle cx="50" cy="50" r="28" fill="#fbc02d" stroke="#f57f17" stroke-width="2.5"/>
              <!-- Rosy Cheeks -->
              <ellipse cx="34" cy="57" rx="5" ry="3" fill="#ff5252" opacity="0.6"/>
              <ellipse cx="66" cy="57" rx="5" ry="3" fill="#ff5252" opacity="0.6"/>
              <!-- Cool Sunglasses -->
              <polygon points="28,40 46,40 43,49 31,49" fill="#212121"/>
              <polygon points="54,40 72,40 69,49 57,49" fill="#212121"/>
              <rect x="44" y="42" width="12" height="3" fill="#212121"/>
              <path d="M30,42 L44,42" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M56,42 L70,42" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
              <!-- Cheerful Smile -->
              <path d="M38,59 Q50,68 62,59" stroke="#3e2723" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
        `;
        break;

      case 'rainy':
        mascotHTML = `
          <div class="mascot-avatar mascot-static" title="Rainy SkyPal">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <!-- Yellow Duckling in Raincoat & Umbrella -->
              <ellipse cx="48" cy="62" rx="20" ry="17" fill="#fdd835" stroke="#f57f17" stroke-width="2.5"/>
              <circle cx="48" cy="40" r="15" fill="#fdd835" stroke="#f57f17" stroke-width="2.5"/>
              <ellipse cx="36" cy="42" rx="7" ry="4" fill="#ff7043" stroke="#e64a19" stroke-width="2"/>
              <circle cx="45" cy="37" r="2.5" fill="#212121"/>
              <rect x="36" y="74" width="9" height="12" rx="4" fill="#0284c7"/>
              <rect x="52" y="74" width="9" height="12" rx="4" fill="#0284c7"/>
              <!-- Umbrella -->
              <g>
                <path d="M48,50 L48,22" stroke="#455a64" stroke-width="3" stroke-linecap="round"/>
                <path d="M22,24 C22,8 74,8 74,24 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2.5"/>
                <circle cx="36" cy="18" r="3" fill="#ffffff"/>
                <circle cx="58" cy="17" r="3" fill="#ffffff"/>
                <circle cx="48" cy="12" r="3" fill="#ffffff"/>
              </g>
              <ellipse cx="48" cy="85" rx="26" ry="6" fill="rgba(56, 189, 248, 0.45)"/>
            </svg>
          </div>
        `;
        break;

      case 'cloudy':
      case 'mist':
        mascotHTML = `
          <div class="mascot-avatar mascot-static" title="Cloudy SkyPal">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <!-- Fluffy Marshmallow Cloud -->
              <path d="M25,65 
                       A16,16 0 0,1 18,38 
                       A22,22 0 0,1 48,24 
                       A24,24 0 0,1 82,35 
                       A18,18 0 0,1 80,65 Z" 
                    fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
              <path d="M36,46 Q41,51 46,46" stroke="#475569" stroke-width="2.8" fill="none" stroke-linecap="round"/>
              <path d="M54,46 Q59,51 64,46" stroke="#475569" stroke-width="2.8" fill="none" stroke-linecap="round"/>
              <path d="M46,55 Q50,58 54,55" stroke="#475569" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <circle cx="32" cy="49" r="3.5" fill="#f43f5e" opacity="0.5"/>
              <circle cx="68" cy="49" r="3.5" fill="#f43f5e" opacity="0.5"/>
            </svg>
          </div>
        `;
        break;

      case 'thunder':
        mascotHTML = `
          <div class="mascot-avatar mascot-static" title="Stormy SkyPal">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <path d="M25,65 
                       A16,16 0 0,1 18,38 
                       A22,22 0 0,1 48,24 
                       A24,24 0 0,1 82,35 
                       A18,18 0 0,1 80,65 Z" 
                    fill="#334155" stroke="#64748b" stroke-width="3"/>
              <circle cx="38" cy="44" r="3" fill="#fef08a"/>
              <circle cx="62" cy="44" r="3" fill="#fef08a"/>
              <polygon points="50,56 42,70 48,70 44,84 58,68 51,68" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/>
            </svg>
          </div>
        `;
        break;

      case 'snowy':
        mascotHTML = `
          <div class="mascot-avatar mascot-static" title="Snowy SkyPal">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <circle cx="50" cy="68" r="22" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5"/>
              <circle cx="50" cy="38" r="16" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5"/>
              <circle cx="43" cy="35" r="2" fill="#1e293b"/>
              <circle cx="53" cy="35" r="2" fill="#1e293b"/>
              <polygon points="48,39 42,42 48,44" fill="#f97316"/>
              <rect x="36" y="48" width="28" height="7" rx="3.5" fill="#ef4444"/>
              <rect x="54" y="52" width="6" height="15" rx="2" fill="#dc2626"/>
              <path d="M68,54 L84,40 M80,44 L86,47" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M32,54 L18,60" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
        `;
        break;

      case 'night':
        mascotHTML = `
          <div class="mascot-avatar mascot-static" title="Starry SkyPal">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <polygon points="50,15 59,38 84,38 64,52 71,76 50,62 29,76 36,52 16,38 41,38" fill="#fde047" stroke="#eab308" stroke-width="2.5"/>
              <path d="M42,46 Q46,50 50,46" stroke="#451a03" stroke-width="2" fill="none" stroke-linecap="round"/>
              <path d="M52,46 Q56,50 60,46" stroke="#451a03" stroke-width="2" fill="none" stroke-linecap="round"/>
              <path d="M47,20 C42,10 32,15 28,24" stroke="#a855f7" stroke-width="4" stroke-linecap="round" fill="none"/>
              <circle cx="28" cy="24" r="3" fill="#ffffff"/>
            </svg>
          </div>
        `;
        break;
    }

    this.mascotContainer.innerHTML = mascotHTML;
  }
}

// Global export
window.WeatherThemeController = WeatherThemeController;
window.WeatherEffectsEngine = WeatherThemeController; // Backward compatible alias
