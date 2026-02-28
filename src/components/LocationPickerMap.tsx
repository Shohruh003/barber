import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Navigation, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  geoAddress?: string;
  onSave: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to fly map to a position
function FlyToPosition({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1 });
    }
  }, [position, map]);
  return null;
}

// Tashkent center as default
const DEFAULT_CENTER: [number, number] = [41.2995, 69.2401];
const DEFAULT_ZOOM = 12;

export function LocationPickerMap({
  latitude,
  longitude,
  geoAddress,
  onSave,
  onCancel,
}: LocationPickerMapProps) {
  const { t } = useTranslation();
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null,
  );
  const [address, setAddress] = useState(geoAddress || "");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const initialCenter: [number, number] =
    latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;
  const initialZoom = latitude && longitude ? 16 : DEFAULT_ZOOM;

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`,
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch {
      // Keep manually entered address if geocoding fails
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      setSelectedPos([lat, lng]);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  // Get current location via browser geolocation API
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedPos([lat, lng]);
        setFlyTo([lat, lng]);
        reverseGeocode(lat, lng);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSave = () => {
    if (selectedPos) {
      onSave(selectedPos[0], selectedPos[1], address);
    }
  };

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border" style={{ height: "300px" }}>
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <FlyToPosition position={flyTo} />
          {selectedPos && <Marker position={selectedPos} icon={markerIcon} />}
        </MapContainer>

        {/* Current location button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={geoLoading}
          className="absolute top-3 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl bg-background border shadow-md"
        >
          {geoLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Navigation className="h-5 w-5 text-primary" />
          )}
        </button>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground text-center">
        {t("barberApp.tapToSelectLocation")}
      </p>

      {/* Address display */}
      {selectedPos && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("barberApp.detectingAddress")}
                </div>
              ) : (
                <p className="text-sm break-words">{address || t("barberApp.addressNotFound")}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                {selectedPos[0].toFixed(6)}, {selectedPos[1].toFixed(6)}
              </p>
            </div>
          </div>

          {/* Manual address edit */}
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("barberApp.editAddress")}
            className="h-10 text-sm"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 h-11" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          {t("common.cancel")}
        </Button>
        <Button
          className="flex-1 h-11"
          onClick={handleSave}
          disabled={!selectedPos || loading}
        >
          <Check className="h-4 w-4 mr-1" />
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
