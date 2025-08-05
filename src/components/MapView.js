// Props: subscriptionKey, geoPoints (array of {lat, lon, cards}), height
import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

const MapView = ({ subscriptionKey, geoPoints, height = 400, selectedCard, onPointClick }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(null); // null means auto-fit
  const [center, setCenter] = useState(null); // for programmatic pan/zoom
  const popupRef = useRef(null); // Track the open popup
  const markersRef = useRef([]); // Track markers

  useEffect(() => {
    if (!mapRef.current || !subscriptionKey) return;

    if (!mapInstance.current) {
      // Find all valid geoPoints for bounds
      const validPoints = geoPoints.filter(pt =>
        typeof pt.lat === 'number' && typeof pt.lon === 'number' &&
        !isNaN(pt.lat) && !isNaN(pt.lon)
      );

      let initialCenter = [0, 0];
      if (validPoints.length > 0) {
        initialCenter = [validPoints[0].lon, validPoints[0].lat];
      }

      mapInstance.current = new atlas.Map(mapRef.current, {
        center: center || initialCenter,
        zoom: zoom || 2,
        authOptions: {
          authType: 'subscriptionKey',
          subscriptionKey,
        },
        dragRotateInteraction: true,
        pitch: 0,
      });

      mapInstance.current.events.add('ready', () => {
        // Clear existing markers
        if (markersRef.current.length > 0) {
          markersRef.current.forEach(marker => {
            if (marker._customPopup) {
              marker._customPopup.close();
            }
            mapInstance.current.markers.remove(marker);
          });
          markersRef.current = [];
        }

        // Add markers for each valid point
        validPoints.forEach((pt, idx) => {
          // Build popup HTML with all card info at this location
          const popupContent = `<div style='min-width:240px;max-width:320px;padding:10px;'>
            <b>Gift Cards at this location:</b><br/><br/>
            ${pt.cards.map(card => `
              <div style='margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #eee;'>
                <b>Number:</b> ${card.GiftCardNumber}<br/>
                <b>Status:</b> ${card.Status}<br/>
                <b>Balance:</b> $${card.Balance}<br/>
                <b>Channel:</b> ${card.PurchaseChannel}<br/>
                <b>Date:</b> ${card.DateCreated}<br/>
                <b>IP:</b> ${card.IPAddress}<br/>
              </div>
            `).join('')}
          </div>`;

          // Create marker
          const marker = new atlas.HtmlMarker({
            color: 'DodgerBlue',
            text: String(idx + 1),
            position: [pt.lon, pt.lat],
            htmlContent: `<div style="background-color: DodgerBlue; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>`
          });

          // Create popup
          const popup = new atlas.Popup({
            content: popupContent,
            pixelOffset: [0, -30]
          });

          // Store popup reference on marker
          marker._customPopup = popup;

          // Add marker to map
          mapInstance.current.markers.add(marker);
          markersRef.current.push(marker);

          // Helper to close any open popup
          const closeOpenPopup = () => {
            if (popupRef.current && popupRef.current !== popup) {
              popupRef.current.close();
            }
            popupRef.current = popup;
          };

          // Add event listeners using Azure Maps events
          mapInstance.current.events.add('mouseenter', marker, (e) => {
            closeOpenPopup();
            popup.setOptions({
              position: marker.getOptions().position
            });
            popup.open(mapInstance.current);
            
            // Set cursor to pointer when hovering over marker
            if (mapRef.current) {
              mapRef.current.style.cursor = 'pointer';
            }
          });

          mapInstance.current.events.add('mouseleave', marker, (e) => {
            popup.close();
            if (popupRef.current === popup) {
              popupRef.current = null;
            }
            
            // Reset cursor when leaving marker
            if (mapRef.current) {
              mapRef.current.style.cursor = 'grab';
            }
          });

          mapInstance.current.events.add('click', marker, (e) => {
            setCenter([pt.lon, pt.lat]);
            setZoom(16);
            if (onPointClick) onPointClick(pt);
          });
        });

        // Fit map to all points if more than one and no specific zoom set
        if (validPoints.length > 1 && !zoom) {
          const lats = validPoints.map(pt => pt.lat);
          const lons = validPoints.map(pt => pt.lon);
          const bounds = [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)]
          ];
          mapInstance.current.setCamera({ bounds, padding: 40 });
        }
      });

      // Set default map cursor behavior
      mapInstance.current.events.add('mousemove', (e) => {
        if (mapRef.current && mapRef.current.style.cursor !== 'pointer') {
          mapRef.current.style.cursor = 'grab';
        }
      });

      mapInstance.current.events.add('dragstart', (e) => {
        if (mapRef.current) {
          mapRef.current.style.cursor = 'grabbing';
        }
      });

      mapInstance.current.events.add('dragend', (e) => {
        if (mapRef.current) {
          mapRef.current.style.cursor = 'grab';
        }
      });

    } else {
      // Update zoom/center if changed
      if (center && zoom) {
        mapInstance.current.setCamera({ center, zoom });
      } else if (zoom) {
        mapInstance.current.setCamera({ zoom });
      } else {
        // Fit to all points if zoom is null
        const validPoints = geoPoints.filter(pt =>
          typeof pt.lat === 'number' && typeof pt.lon === 'number' &&
          !isNaN(pt.lat) && !isNaN(pt.lon)
        );
        if (validPoints.length > 1) {
          const lats = validPoints.map(pt => pt.lat);
          const lons = validPoints.map(pt => pt.lon);
          const bounds = [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)]
          ];
          mapInstance.current.setCamera({ bounds, padding: 40 });
        }
      }
    }

    // Clean up function
    return () => {
      if (popupRef.current) {
        popupRef.current.close();
        popupRef.current = null;
      }
      
      if (mapInstance.current) {
        // Clean up markers and their popups
        if (markersRef.current.length > 0) {
          markersRef.current.forEach(marker => {
            if (marker._customPopup) {
              marker._customPopup.close();
            }
            mapInstance.current.markers.remove(marker);
          });
          markersRef.current = [];
        }
        
        mapInstance.current.dispose();
        mapInstance.current = null;
      }
    };
  }, [subscriptionKey, geoPoints, zoom, center, onPointClick]);

  // Fullscreen style
  const mapStyle = fullscreen
    ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1300 }
    : { width: '100%', height };

  // Map zoom percent to Azure Maps zoom levels
  const zoomPercents = [10, 20, 50, 100];
  const percentToZoom = { 10: 2, 20: 4, 50: 8, 100: 16 };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1400, display: 'flex', gap: 8 }}>
        <select
          value={zoom === null ? '' : zoom}
          onChange={e => {
            const val = e.target.value;
            if (val === '') {
              setZoom(null); // auto-fit
              setCenter(null);
            } else {
              setZoom(Number(val));
            }
          }}
          style={{ padding: 6 }}
        >
          <option value="">Auto-fit</option>
          {zoomPercents.map(pct => (
            <option key={pct} value={percentToZoom[pct]}>{pct}%</option>
          ))}
        </select>
        <button onClick={() => setFullscreen(f => !f)} style={{ padding: 6 }}>
          {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>
      <div ref={mapRef} style={mapStyle} />
    </div>
  );
};

export default MapView;