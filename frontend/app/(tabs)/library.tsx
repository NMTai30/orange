import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
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
import { db } from "../../firebaseConfig";

export default function LibraryScreen() {
  const [intro, setIntro] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const snap = await getDocs(collection(db, "library"));
        const items: any[] = [];

        snap.forEach((doc) => {
          const d = doc.data();
          if (doc.id === "introduction") {
            setIntro(d);
          } else {
            items.push(d);
          }
        });

        setData(items);
      } catch (e) {
        console.error("Lỗi tải Firestore:", e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  if (loading)
    return <ActivityIndicator size="large" color="#FF9800" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      {/* Giới thiệu */}
      {intro && (
        <View style={styles.introCard}>
          {intro.image && (
            <Image source={{ uri: intro.image }} style={styles.introImage} />
          )}
          <Text style={styles.introTitle}>Giới thiệu</Text>
          <Text style={styles.introText}>{intro.description}</Text>
        </View>
      )}

      {/* Danh sách cam */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() =>
              router.push({
                pathname: "/(library)/libraryDetail",
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
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 10 },
  introCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  introImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
  },
  introTitle: { fontSize: 20, fontWeight: "bold", color: "#2E7D32" },
  introText: { textAlign: "center", fontSize: 14, color: "#555" },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 15,
  },
  itemText: { fontSize: 16, fontWeight: "600" },
});
