import { AirPollutionSchema } from "./schemas/airPollutionSchema"
import { GeocodeSchema } from "./schemas/geocodeSchema"
import { weatherSchema } from "./schemas/weatherSchema"

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY

export async function getWeather({ lat, lon }: { lat: number; lon: number }) {
  const res = await fetch(
    `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,alerts&appid=${OPENWEATHER_KEY}`
  )
  const data = await res.json()
  return weatherSchema.parse(data)
}

export async function getGeocode(location: string) {
  const res = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${OPENWEATHER_KEY}`
  )
  const data = await res.json()
  return GeocodeSchema.parse(data)
}

export async function getAirPollution({
  lat,
  lon,
}: {
  lat: number
  lon: number
}) {
  const res = await fetch(
    `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`
  )
  const data = await res.json()
  return AirPollutionSchema.parse(data)
}
