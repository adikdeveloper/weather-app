// API sozlamalari
const API_KEY = '2b64f57ce6ad4b679ce151321241312';
const url = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=Tashkent&aqi=no&lang=uz`;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM elementlari
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
document.addEventListener('DOMContentLoaded', () => {
    getWeatherData('Tashkent'); // Standart shahar
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
        
        // Joriy ob-havo ma'lumotlari
        const weatherResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=uz`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('Shahar topilmadi yoki API xatolik yuz berdi');
        }
        
        const weatherData = await weatherResponse.json();
        
        // 5 kunlik prognoz
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=uz`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Prognoz ma\'lumotlarini olishda xatolik');
        }
        
        const forecastData = await forecastResponse.json();
        
        updateUI(weatherData, forecastData);
        saveToLocalStorage(city);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// UI ni yangilash
function updateUI(weatherData, forecastData) {
    updateCurrentWeather(weatherData);
    updateForecast(forecastData);
    addFadeInAnimation();
}

// Joriy ob-havo ma'lumotlarini yangilash
function updateCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('weatherDescription').textContent = capitalizeFirstLetter(data.weather[0].description);
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    
    updateWeatherIcon(data.weather[0].id);
}

// Ob-havo ikonkasini yangilash
function updateWeatherIcon(weatherId) {
    const icon = document.getElementById('weatherIcon');
    const timeOfDay = getDayOrNight();
    
    const iconMap = {
        200: 'thunderstorm',
        300: 'sprinkle',
        500: 'rain',
        600: 'snow',
        700: 'fog',
        800: 'sunny',
        801: 'cloudy',
        802: 'cloudy',
        803: 'cloudy',
        804: 'cloudy'
    };
    
    let iconName = 'day-sunny'; // default icon
    
    for (let code in iconMap) {
        if (weatherId >= parseInt(code) && weatherId < parseInt(code) + 100) {
            iconName = `${timeOfDay}-${iconMap[code]}`;
            break;
        }
    }
    
    icon.className = `wi wi-${iconName}`;
}

// 5 kunlik prognozni yangilash
function updateForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';
    
    const dailyForecasts = groupDailyForecasts(data.list);
    
    dailyForecasts.forEach(forecast => {
        const card = createForecastCard(forecast);
        forecastContainer.appendChild(card);
    });
}

// Prognozlarni kunlar bo'yicha guruhlash
function groupDailyForecasts(forecastList) {
    const dailyData = {};
    
    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        
        if (!dailyData[date]) {
            dailyData[date] = forecast;
        }
    });
    
    return Object.values(dailyData).slice(1, 6); // Keyingi 5 kun
}

// Prognoz kartochkasini yaratish
function createForecastCard(forecast) {
    const div = document.createElement('div');
    div.className = 'col';
    
    const date = new Date(forecast.dt * 1000);
    const dayName = date.toLocaleDateString('uz-UZ', { weekday: 'short' });
    const temp = Math.round(forecast.main.temp);
    
    div.innerHTML = `
        <div class="forecast-card">
            <h5>${dayName}</h5>
            <i class="wi wi-${getWeatherIcon(forecast.weather[0].id)}"></i>
            <p class="temp">${temp}°C</p>
            <p class="description">${capitalizeFirstLetter(forecast.weather[0].description)}</p>
        </div>
    `;
    
    return div;
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
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=uz`
        );
        
        if (!response.ok) throw new Error('Koordinatalar bo\'yicha ma\'lumot olishda xatolik');
        
        const data = await response.json();
        getWeatherData(data.name);
        
    } catch (error) {
        showError(error.message);
        getWeatherData(getLastCity());
    }
}

// Dastlabki yuklash
getLocationWeather();
