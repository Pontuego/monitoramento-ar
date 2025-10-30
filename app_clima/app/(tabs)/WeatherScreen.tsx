import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function WeatherScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const pollutantNames: { [key: string]: string } = {
    co: "Monóxido de Carbono (CO)",
    no: "Óxido Nítrico (NO)",
    no2: "Dióxido de Nitrogênio (NO₂)",
    o3: "Ozônio (O₃)",
    so2: "Dióxido de Enxofre (SO₂)",
    pm2_5: "Partículas PM2.5",
    pm10: "Partículas PM10",
    nh3: "Amônia (NH₃)",
  };

  // Cores da box de acordo com AQI
  const aqiColors: { [key: number]: string } = {
    1: "#4CAF50", // Bom - verde
    2: "#FFEB3B", // Moderado - amarelo
    3: "#FF9800", // Ruim - laranja
    4: "#F44336", // Muito Ruim - vermelho
    5: "#9C27B0", // Perigoso - roxo
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Não foi possível acessar sua localização');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const res = await fetch(`http://172.22.115.174:8000/weather?lat=${latitude}&lon=${longitude}`);
        const jsonData = await res.json();
        setData(jsonData);

      } catch (err) {
        console.log(err);
        Alert.alert('Erro', 'Não foi possível obter os dados do clima ou da qualidade do ar');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.appBackground}>
        <ThemedText>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  if (!data) {
    return (
      <ThemedView style={styles.appBackground}>
        <ThemedText>Não foi possível obter os dados do clima ou da qualidade do ar.</ThemedText>
      </ThemedView>
    );
  }

  const dominantPollutant = data.air_quality
    ? pollutantNames[data.air_quality.dominant_pollutant] || data.air_quality.dominant_pollutant
    : "N/A";

  const boxColor = data.air_quality ? aqiColors[data.air_quality.aqi] || "#FFFFFF" : "#FFFFFF";

  return (
    <ThemedView style={styles.appBackground}>
      <View style={[styles.card, { backgroundColor: boxColor }]}>
        <ThemedText type="title" style={styles.cardTitle}>Clima Atual</ThemedText>
        <ThemedText style={styles.info}>Região: {data.cidade}</ThemedText>
        <ThemedText style={styles.info}>Temperatura: {data.temperatura}</ThemedText>
        <ThemedText style={styles.info}>Condição: {data.condicao}</ThemedText>

        <ThemedText type="title" style={[styles.cardTitle, { marginTop: 16 }]}>Qualidade do Ar</ThemedText>
        {data.air_quality ? (
          <>
            <ThemedText style={styles.info}>
              AQI: {data.air_quality.aqi} ({data.air_quality.status})
            </ThemedText>
            <ThemedText style={styles.info}>
              Poluente dominante: {dominantPollutant}
            </ThemedText>
            <ThemedText style={styles.info}>
              Recomendação: {data.air_quality.recommendation}
            </ThemedText>
          </>
        ) : (
          <ThemedText style={styles.info}>Não foi possível obter a qualidade do ar.</ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    backgroundColor: "#87CEEB", // Cor fixa de estilo climático
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cardTitle: {
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    marginBottom: 4,
  },
});
