import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function LibraryScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://192.168.0.105:8000/library")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <ActivityIndicator size="large" color="#FF9800" style={{ flex: 1, marginTop: 50 }} />;

  // Lấy phần giới thiệu ở đầu (nếu có)
  const intro = data.find((item) => item.name.toLowerCase().includes("giới thiệu"));
  const oranges = data.filter((item) => !item.name.toLowerCase().includes("giới thiệu"));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      {intro && (
        <View style={styles.introCard}>
          <Image source={{ uri: intro.image }} style={styles.introImage} />
          <Text style={styles.introTitle}>{intro.name}</Text>
          <Text style={styles.introText}>{intro.description}</Text>
        </View>
      )}

      {oranges.map((item) => (
        <View key={item.name} style={styles.card}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Độ ngọt: {item.sweetness ?? "Không rõ"}</Text>
            <Text>Nguồn gốc: {item.origin ?? "Không rõ"}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  introCard: {
    padding: 16,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    margin: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  introImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF9800",
    marginBottom: 6,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
  },
  card: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  image: {
    width: 100,
    height: 100,
  },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
});
