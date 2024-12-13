// API sozlamalari
const API_KEY = '2b64f57ce6ad4b679ce151321241312';
const BASE_URL = 'https://api.weatherapi.com/v1';

// DOM elementlari
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
document.addEventListener('DOMContentLoaded', () => {
    getLocationWeather();
});

// Qidiruv funksiyasi
async function handleSearch(e) {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        await getWeatherData(city);
        cityInput.value = '';
    }
}

// Asosiy ob-havo ma'lumotlarini olish
async function getWeatherData(city) {
    try {
        showLoading();
        
        // Joriy ob-havo va 5 kunlik prognoz ma'lumotlarini olish
        const response = await fetch(
            `${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=5&lang=uz&aqi=no`
        );
        
        if (!response.ok) {
            throw new Error('Shahar topilmadi yoki API xatolik yuz berdi');
        }
        
        const data = await response.json();
        updateUI(data);
        saveToLocalStorage(city);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// UI ni yangilash
function updateUI(data) {
    updateCurrentWeather(data);
    updateForecast(data);
    addFadeInAnimation();
}

// Joriy ob-havo ma'lumotlarini yangilash
function updateCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.location.name}, ${data.location.country}`;
    document.getElementById('temperature').textContent = `${Math.round(data.current.temp_c)}°C`;
    document.getElementById('weatherDescription').textContent = capitalizeFirstLetter(data.current.condition.text);
    document.getElementById('humidity').textContent = `${data.current.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.current.wind_kph} km/s`;
    document.getElementById('pressure').textContent = `${data.current.pressure_mb} hPa`;
    
    updateWeatherIcon(data.current.condition.code);
}

// Ob-havo ikonkasini yangilash
function updateWeatherIcon(conditionCode) {
    const icon = document.getElementById('weatherIcon');
    const timeOfDay = getDayOrNight();
    
    // WeatherAPI condition codes ga asoslangan ikonkalar
    const iconMap = {
        1000: 'day-sunny',        // Clear
        1003: 'day-cloudy',       // Partly cloudy
        1006: 'cloudy',           // Cloudy
        1009: 'day-cloudy-high',  // Overcast
        1030: 'day-fog',          // Mist
        1063: 'day-rain',         // Patchy rain
        1066: 'day-snow',         // Patchy snow
        1087: 'day-thunderstorm', // Thundery outbreaks
        1183: 'day-rain',         // Light rain
        1189: 'rain',             // Moderate rain
        1195: 'rain',             // Heavy rain
        1273: 'thunderstorm',     // Patchy light rain with thunder
        1279: 'snow-thunderstorm' // Patchy light snow with thunder
    };
    
    let iconName = iconMap[conditionCode] || 'day-sunny'; // default icon
    
    // Agar tun bo'lsa va ikonka kunduzi uchun bo'lsa, uni tunga o'zgartirish
    if (timeOfDay === 'night' && iconName.startsWith('day-')) {
        iconName = iconName.replace('day-', 'night-');
    }
    
    icon.className = `wi wi-${iconName}`;
}

// 5 kunlik prognozni yangilash
function updateForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';
    
    data.forecast.forecastday.forEach((day, index) => {
        if (index > 0) { // Bugungi kunni ko'rsatmaslik uchun
            const card = createForecastCard(day);
            forecastContainer.appendChild(card);
        }
    });
}

// Prognoz kartochkasini yaratish
function createForecastCard(forecast) {
    const div = document.createElement('div');
    div.className = 'col';
    
    const date = new Date(forecast.date);
    const dayName = date.toLocaleDateString('uz-UZ', { weekday: 'short' });
    
    div.innerHTML = `
        <div class="forecast-card">
            <h5>${dayName}</h5>
            <i class="wi wi-${getWeatherIcon(forecast.day.condition.code)}"></i>
            <p class="temp">${Math.round(forecast.day.avgtemp_c)}°C</p>
            <p class="description">${capitalizeFirstLetter(forecast.day.condition.text)}</p>
        </div>
    `;
    
    return div;
}

// Ob-havo kodi uchun ikonka olish
function getWeatherIcon(conditionCode) {
    const iconMap = {
        1000: 'day-sunny',
        1003: 'day-cloudy',
        1006: 'cloudy',
        1009: 'cloudy',
        1030: 'fog',
        1063: 'rain',
        1066: 'snow',
        1087: 'thunderstorm',
        1183: 'rain',
        1189: 'rain',
        1195: 'rain',
        1273: 'thunderstorm',
        1279: 'snow-thunderstorm'
    };
    
    return iconMap[conditionCode] || 'day-sunny';
}

// Yordamchi funksiyalar
function showLoading() {
    loadingSpinner.classList.add('active');
}

function hideLoading() {
    loadingSpinner.classList.remove('active');
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.show();
}

function getDayOrNight() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'day' : 'night';
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function addFadeInAnimation() {
    const weatherCard = document.querySelector('.weather-card');
    weatherCard.style.animation = 'none';
    weatherCard.offsetHeight; // Trigger reflow
    weatherCard.style.animation = 'fadeIn 0.5s ease-out';
}

// LocalStorage bilan ishlash
function saveToLocalStorage(city) {
    localStorage.setItem('lastCity', city);
}

function getLastCity() {
    return localStorage.getItem('lastCity') || 'Tashkent';
}

// Geolokatsiya
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            error => {
                console.error('Geolokatsiya xatosi:', error);
                getWeatherData(getLastCity());
            }
        );
    } else {
        getWeatherData(getLastCity());
    }
}

// Koordinatalar bo'yicha ob-havo
async function getWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=5&lang=uz&aqi=no`
        );
        
        if (!response.ok) {
            throw new Error('Koordinatalar bo\'yicha ma\'lumot olishda xatolik');
        }
        
        const data = await response.json();
        updateUI(data);
        saveToLocalStorage(data.location.name);
        
    } catch (error) {
        showError(error.message);
        getWeatherData(getLastCity());
    }
}
