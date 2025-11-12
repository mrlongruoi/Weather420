import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect } from "react"
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk"
import type { Coords } from "../types"
import type { Map as LeafletMap, LeafletMouseEvent, Layer } from "leaflet"

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY
const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY

type Props = {
  coords: Coords
  onMapClick: (lat: number, lon: number) => void
  mapType: string // ex: "clouds_new", "temp_new", ...
}
// small helper to coerce runtime values to numbers with a fallback
function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default function WeatherMap({ coords, onMapClick, mapType }: Readonly<Props>) {
  const lat = toNumber(coords.lat, 0)
  const lon = toNumber(coords.lon, 0)

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={5}
      style={{ width: "100%", height: "100%" }}
    >
      <MapClick onMapClick={onMapClick} coords={coords} />
      <MapTileLayer />
      <TileLayer
        opacity={0.6}
        url={`https://tile.openweathermap.org/map/${mapType}/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`}
        attribution='&copy; <a href="https://openweathermap.org/">OpenWeather</a>'
      />
      {Number.isFinite(lat) && Number.isFinite(lon) ? (
        <Marker position={[lat, lon]} />
      ) : null}
    </MapContainer>
  )
}

function MapClick({
  onMapClick,
  coords,
}: {
  onMapClick: (lat: number, lon: number) => void
  coords: Coords
}) {
  const map = useMap()

  // Tự động pan theo khi chọn thủ đô mới
  useEffect(() => {
  const lat = toNumber(coords.lat, Number.NaN)
  const lon = toNumber(coords.lon, Number.NaN)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.panTo([lat, lon])
    }
  }, [coords, map])

  // Cho phép click để lấy tọa độ
  useEffect(() => {
    const handler = (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      onMapClick(lat, lng)
    }
    map.on("click", handler)
    return () => {
      map.off("click", handler)
    }
  }, [map, onMapClick])

  return null
}

function MapTileLayer() {
  const map = useMap() as unknown as LeafletMap

  useEffect(() => {
    // Build the MapTiler style URL and prefetch it to verify the key/permission.
    // If the fetch fails (403/401/etc.), we log a clear error and avoid calling setStyle
    // with an invalid value which triggers the Map.setStyle warning.
    const styleUrl = `https://api.maptiler.com/maps/streets-v4-dark/style.json?key=${MAPTILER_KEY}`

    let cancelled = false
    let addedLayer: Layer | undefined

    ;(async () => {
      try {
        const resp = await fetch(styleUrl)
        if (!resp.ok) {
          console.error(
            `MapTiler style fetch failed: ${resp.status} ${resp.statusText}`,
            styleUrl
          )
          return
        }

        const styleJson = await resp.json()

        if (cancelled) return

        const tileLayer = new MaptilerLayer({
          apiKey: MAPTILER_KEY,
          // pass the parsed StyleSpecification object instead of the raw id
          // to ensure the SDK receives a valid StyleSpecification and avoid
          // invalid-style warnings.
          style: styleJson,
        })

        if (typeof map.whenReady === "function") {
          map.whenReady(() => {
            tileLayer.addTo(map)
            addedLayer = tileLayer
          })
        } else {
          tileLayer.addTo(map)
          addedLayer = tileLayer
        }
      } catch (err) {
        console.error("Error loading MapTiler style", err, styleUrl)
      }
    })()

    return () => {
      cancelled = true
      if (addedLayer && map && typeof map.removeLayer === "function") {
        map.removeLayer(addedLayer)
      }
    }
  }, [map])

  return null
}
