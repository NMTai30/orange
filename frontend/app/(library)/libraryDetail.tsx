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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;

    const loadDetail = async () => {
      try {
        const q = query(collection(db, "library"), where("name", "==", name));
        const snap = await getDocs(q);

        if (!snap.empty) {
          setData(snap.docs[0].data());
        }
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [name]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );

  if (!data)
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>Không tìm thấy dữ liệu!</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      {data.image && (
        <Image source={{ uri: data.image }} style={styles.image} />
      )}

      <Text style={styles.title}>{data.name}</Text>
      <Text style={styles.sweet}>
        Độ ngọt (°Brix): {data.sweetness_brix}
      </Text>
      <Text style={styles.desc}>{data.description}</Text>
      <Text style={styles.info}>Nguồn gốc: {data.origin}</Text>
      <Text style={styles.info}>Mùa thu hoạch: {data.harvest_season}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: {
    width: "100%",
    height: 230,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  sweet: { fontSize: 16, color: "#444", marginBottom: 10 },
  desc: { fontSize: 15, color: "#333", lineHeight: 22, marginVertical: 10 },
  info: { fontSize: 15, color: "#555", marginBottom: 5 },
});
