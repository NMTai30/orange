import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LibraryScreen() {
  const [intro, setIntro] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const API_BASE = "http://192.168.0.105:8000"; // ⚠️ Thay IP backend của bạn

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/library/introduction`).then((res) => res.json()),
      fetch(`${API_BASE}/library`).then((res) => res.json()),
    ])
      .then(([introData, libraryData]) => {
        setIntro(introData);
        setData(libraryData);
      })
      .catch((err) => console.error("❌ Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <ActivityIndicator size="large" color="#FF9800" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      {/* 🟠 Phần giới thiệu */}
      {intro && (
        <View style={styles.introCard}>
          {intro.image && (
            <Image
              source={{ uri: `${API_BASE}${intro.image}` }}
              style={styles.introImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.introTitle}>Giới thiệu</Text>
          <Text style={styles.introText}>{intro.description}</Text>
        </View>
      )}

      {/* 🍊 Danh sách cam */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() =>
              router.push({
                pathname: "/libraryDetail",
                params: { name: item.name },
              })
            }
          >
            <Text style={styles.itemText}>{item.name}</Text>
            <Ionicons name="arrow-forward" size={22} color="#FF9800" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 10,
  },
  introCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
  },
  introImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  introText: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
