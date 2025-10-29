from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI(title="Monitoramento do Clima e Qualidade do Ar")

# Permite conexão do app Expo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = "f323f83a6b464f4438fbe5935b4ad1a3"  # sua chave

@app.get("/weather")
def get_weather(lat: float = Query(...), lon: float = Query(...)):
    """Retorna dados do clima e qualidade do ar usando OpenWeather API"""
    try:
        # ===== CLIMA =====
        weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&lang=pt_br&appid={API_KEY}"
        weather_res = requests.get(weather_url).json()

        cidade = weather_res.get("name", "Desconhecida")
        temperatura = f"{weather_res['main']['temp']}°C" if "main" in weather_res else "N/A"
        condicao = weather_res["weather"][0]["description"].capitalize() if "weather" in weather_res else "N/A"

        # ===== QUALIDADE DO AR =====
        air_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
        air_res = requests.get(air_url).json()

        components = air_res['list'][0]['components'] if 'list' in air_res and air_res['list'] else {}
        pm2_5 = components.get('pm2_5')

        # Calcular AQI, status e recomendação baseado no PM2.5
        if pm2_5 is None:
            aqi, status, recommendation = None, "Erro", "Não há dados de PM2.5 disponíveis."
        elif pm2_5 <= 12:
            aqi, status, recommendation = 1, "Bom", "Excelente para atividades ao ar livre!"
        elif pm2_5 <= 35:
            aqi, status, recommendation = 2, "Moderado", "Seguro, mas evite esforço físico intenso."
        elif pm2_5 <= 55:
            aqi, status, recommendation = 3, "Ruim", "Pessoas sensíveis devem evitar sair."
        elif pm2_5 <= 150:
            aqi, status, recommendation = 4, "Muito Ruim", "Evite sair de casa, o ar está poluído."
        else:
            aqi, status, recommendation = 5, "Perigoso", "Permaneça em casa — risco grave à saúde."

        # Determinar poluente dominante
        dominant_pollutant = max(components, key=components.get) if components else "N/A"

        return {
            "cidade": cidade,
            "temperatura": temperatura,
            "condicao": condicao,
            "air_quality": {
                "aqi": aqi,
                "status": status,
                "recommendation": recommendation,
                "pm2_5": pm2_5,
                "pm10": components.get('pm10'),
                "co": components.get('co'),
                "no2": components.get('no2'),
                "so2": components.get('so2'),
                "dominant_pollutant": dominant_pollutant
            }
        }

    except Exception as e:
        return {"error": str(e)}