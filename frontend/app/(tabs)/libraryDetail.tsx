import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

export default function LibraryDetailScreen() {
  const { name } = useLocalSearchParams();
  const orangeName = Array.isArray(name) ? name[0] : name;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://192.168.0.105:8000"; // ⚠️ Đổi IP theo backend thật của bạn

  useEffect(() => {
    if (!orangeName) return;

    fetch(`${API_BASE}/library/${encodeURIComponent(orangeName)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => {
        console.error("❌ Lỗi khi tải chi tiết cam:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [orangeName]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={{ marginTop: 10, color: "#666" }}>Đang tải thông tin...</Text>
      </View>
    );

  if (!data)
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color="red" />
        <Text style={{ color: "red", marginTop: 10 }}>
          Không tìm thấy thông tin cam!
        </Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      {/* Ảnh minh họa */}
      {data.image && (
        <Image
          source={{ uri: `${API_BASE}${data.image}` }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Thông tin chi tiết */}
      <Text style={styles.title}>{data.name}</Text>
      <Text style={styles.sweetness}>
        🍊 Độ ngọt:{" "}
        <Text style={{ fontWeight: "bold", color: "#FF9800" }}>
          {data.sweetness || "Chưa có dữ liệu"}
        </Text>
      </Text>

      {data.description && (
        <Text style={styles.description}>{data.description}</Text>
      )}

      {data.origin && (
        <Text style={styles.origin}>📍 Nguồn gốc: {data.origin}</Text>
      )}

      {data.harvest && (
        <Text style={styles.harvest}>🕐 Mùa thu hoạch: {data.harvest}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  image: {
    width: "100%",
    height: 230,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 6,
  },
  sweetness: {
    fontSize: 16,
    color: "#444",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 8,
  },
  origin: {
    fontSize: 15,
    color: "#555",
    marginBottom: 5,
  },
  harvest: {
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
