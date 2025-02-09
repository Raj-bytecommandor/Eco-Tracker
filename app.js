class CarbonCalculator {
  constructor() {
      this.carInput = document.getElementById('carTravel');
      this.publicTransportInput = document.getElementById('publicTransport');
      this.userFootprintElement = document.getElementById('userFootprint');
      this.localAverageElement = document.getElementById('localAverage');
      this.airQualityElement = document.getElementById('airQuality');
      this.weatherIcon = document.getElementById('weatherIcon');
      this.temperature = document.getElementById('temperature');
      this.weatherDescription = document.getElementById('weatherDescription');
      this.humidity = document.getElementById('humidity');
      
      this.footprintHistory = JSON.parse(localStorage.getItem('footprintHistory')) || [];
      this.chart = null;
      
      this.initChart();
      document.getElementById('calculateBtn').addEventListener('click', () => this.calculate());
      this.detectLocation();
  }

  initChart() {
      const ctx = document.getElementById('historyChart').getContext('2d');
      this.chart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: this.getLastSixMonths(),
              datasets: [{
                  label: 'Monthly Carbon Footprint (kg CO₂)',
                  data: this.footprintHistory,
                  borderColor: '#4CAF50',
                  tension: 0.3
              }]
          }
      });
  }

  detectLocation() {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              position => this.fetchAllData(position.coords),
              error => this.handleError("Location access denied")
          );
      }
  }

  async fetchAllData(coords) {
      try {
          const API_KEY = 'dd63927ef57aea94baffb5d126eb6f7f';
          
          
          const airResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}`
          );
          const airData = await airResponse.json();
          if (airData.list?.length > 0) {
              this.displayAirQuality(airData.list[0].main.aqi);
          }

          
          const weatherResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&appid=${API_KEY}`
          );
          const weatherData = await weatherResponse.json();
          this.displayWeather(weatherData);

      } catch (error) {
          console.error('API Error:', error);
          this.handleError("Data unavailable");
      }
  }

  calculate() {
      const CAR_EMISSION = 0.192;
      const BUS_EMISSION = 0.089;
      const carEmission = this.carInput.value * CAR_EMISSION;
      const transportEmission = this.publicTransportInput.value * BUS_EMISSION;
      const totalEmission = carEmission + transportEmission;
      
      this.displayResults(totalEmission);
      this.saveToHistory(totalEmission);
      this.updateChart();
  }

  displayResults(userEmission) {
      const NATIONAL_AVERAGE = 300;
      this.userFootprintElement.textContent = `${userEmission.toFixed(1)} kg CO₂`;
      this.localAverageElement.textContent = `${NATIONAL_AVERAGE} kg CO₂`;
      this.userFootprintElement.innerHTML += userEmission < NATIONAL_AVERAGE ? ' 🌿' : ' ⚠️';
  }

  displayWeather(data) {
      this.temperature.textContent = Math.round(data.main.temp);
      this.weatherDescription.textContent = data.weather[0].description;
      this.humidity.textContent = data.main.humidity;
      this.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  }

  displayAirQuality(aqi) {
      const qualityLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
      this.airQualityElement.textContent = `${qualityLevels[aqi-1]} (AQI ${aqi})`;
      this.airQualityElement.style.color = ['#4CAF50', '#FFEB3B', '#FF9800', '#F44336', '#9C27B0'][aqi-1];
  }

  saveToHistory(emission) {
      this.footprintHistory.push(emission);
      if (this.footprintHistory.length > 6) this.footprintHistory.shift();
      localStorage.setItem('footprintHistory', JSON.stringify(this.footprintHistory));
  }

  updateChart() {
      this.chart.data.datasets[0].data = this.footprintHistory;
      this.chart.update();
  }

  handleError(message) {
      console.error(message);
      this.airQualityElement.textContent = "Data unavailable";
      this.weatherDescription.textContent = "Weather data unavailable";
  }

  getLastSixMonths() {
      const months = [];
      const date = new Date();
      for (let i = 5; i >= 0; i--) {
          const pastDate = new Date(date.getFullYear(), date.getMonth() - i, 1);
          months.push(pastDate.toLocaleString('default', { month: 'short' }));
      }
      return months;
  }
}

new CarbonCalculator();
