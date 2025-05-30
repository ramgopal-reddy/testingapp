import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AirQualityByCity = () => {
  const [city, setCity] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [aqData, setAqData] = useState(null);
  const [error, setError] = useState('');

  const API_KEY = 'AIzaSyDG6BASc2gy8az_oXrKwxZzdN0UZUIq8VU'; // ✅ Your real key

  // Load saved city from localStorage on initial load
  useEffect(() => {
    const savedCity = localStorage.getItem('defaultCity');
    if (savedCity) {
      setCity(savedCity);
      handleSearch(savedCity); // Trigger search on load
    }
  }, []);

  const fetchCoordinates = async (cityName) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: cityName,
          format: 'json',
          limit: 1,
        },
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setCoordinates({ lat: parseFloat(lat), lon: parseFloat(lon) });
        return { lat: parseFloat(lat), lon: parseFloat(lon) };
      } else {
        throw new Error('Location not found');
      }
    } catch (err) {
      throw new Error('Failed to fetch coordinates');
    }
  };

  const fetchAirQuality = async (lat, lon) => {
    try {
      const response = await axios.post(
        `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}`,
        {
          universalAqi: true,
          location: {
            latitude: lat,
            longitude: lon,
          },
          extraComputations: [
            "HEALTH_RECOMMENDATIONS",
            "DOMINANT_POLLUTANT_CONCENTRATION",
            "POLLUTANT_CONCENTRATION",
            "LOCAL_AQI",
            "POLLUTANT_ADDITIONAL_INFO",
          ],
          languageCode: "en",
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setAqData(response.data);
    } catch (err) {
      setError('Failed to fetch air quality data');
    }
  };

  const handleSearch = async (searchCity = city) => {
    setError('');
    setAqData(null);
    try {
      const coords = await fetchCoordinates(searchCity);
      await fetchAirQuality(coords.lat, coords.lon);
      localStorage.setItem('defaultCity', searchCity); // Save for future sessions
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4">
      <h2>Search Air Quality by City</h2>
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city (e.g. New York)"
      />
      <button onClick={() => handleSearch()}>Search</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {aqData && (
        <div>
          <h3>Air Quality Indexes</h3>
          <ul>
            {aqData.indexes.map((index) => (
              <li key={index.code}>
                {index.displayName}: {index.aqi} ({index.category})
              </li>
            ))}
          </ul>

          <h3>Pollutants</h3>
          <ul>
            {aqData.pollutants.map((pollutant) => (
              <li key={pollutant.code}>
                <strong>{pollutant.fullName}:</strong> {pollutant.concentration.value} {pollutant.concentration.units}
                <p><em>{pollutant.additionalInfo.effects}</em></p>
              </li>
            ))}
          </ul>

          <h3>Health Recommendations</h3>
          <p>{aqData.healthRecommendations.generalPopulation}</p>
        </div>
      )}
    </div>
  );
};

export default AirQualityByCity;
