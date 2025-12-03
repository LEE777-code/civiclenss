export interface WeatherData {
    temp: number;
    condition: string;
    location: string;
    icon: string;
}

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "";

export const getWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
    console.log("WeatherService: Fetching weather...");
    console.log("WeatherService: API Key present?", !!API_KEY);

    if (!API_KEY) {
        console.warn("Weather API Key is missing. Please set VITE_WEATHER_API_KEY in .env");
        return null;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();

        return {
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main,
            location: data.name,
            icon: data.weather[0].icon,
        };
    } catch (error) {
        console.error("Error fetching weather:", error);
        return null;
    }
};
