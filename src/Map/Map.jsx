import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import icon from "../Images/icon.png";
import L from "leaflet";

export default function Map({ coords, displayName, coordinates, mapClickLatLng }) {
  
  const { latitude, longitude } = coords;
  const [Pcoordinates, setPCoordinates] = useState([]);

  useEffect(() => {
    setPCoordinates(coordinates && coordinates.map((row) => [row[1], row[0]]));
  }, []);

  const customIcon = new L.Icon({
    iconUrl: icon,
    iconSize: [25, 35],
    iconAnchor: [5, 30]
  });

  function MapView() {
    let map = useMap();
    map.setView([latitude, longitude], map.getZoom());
    return null;
  }

  function MapEvent() {
    const map = useMapEvents({
      click: (e) => {
        mapClickLatLng(e.latlng.lat, e.latlng.lng);
      }
    });
    return null;
  }
  
  return (
    <MapContainer
      classsName="map"
      center={[latitude, longitude]}
      zoom={5}
      scrollWheelZoom={true}
      bounds={Pcoordinates}
      boundsOptions={{ padding: [1, 1] }}
    >
      
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> 
        contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polygon positions={Pcoordinates} />

      <Marker icon={customIcon} position={[latitude, longitude]}>
        <Popup>{displayName}</Popup>
      </Marker>
      <MapView />
      <MapEvent />
        
    </MapContainer>
  );
}
