import { useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

export default function LibraryDetailScreen() {
  const { name } = useLocalSearchParams();
  const orangeName = Array.isArray(name) ? name[0] : name; // ✅ tránh lỗi khi name là mảng
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orangeName) {
      console.warn("⚠️ Không có tên cam được truyền vào!");
      setLoading(false);
      return;
    }

    const loadDetail = async () => {
      try {
        // ✅ Lấy document có field "name" trùng với orangeName
        const q = query(collection(db, "library_items"), where("name", "==", orangeName));
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          const docData = querySnap.docs[0].data();
          setData(docData);
        } else {
          console.warn("⚠️ Không tìm thấy cam có tên:", orangeName);
          setData(null);
        }
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [orangeName]);

  // 🌀 Loading
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={{ marginTop: 10, color: "#777" }}>Đang tải dữ liệu...</Text>
      </View>
    );

  // ❌ Không có dữ liệu
  if (!data)
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>Không tìm thấy thông tin cam!</Text>
      </View>
    );

  // ✅ Hiển thị thông tin chi tiết
  return (
    <ScrollView style={styles.container}>
      {data.image && (
        <Image
          source={{ uri: data.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

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
