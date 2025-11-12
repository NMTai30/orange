import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
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
    const loadData = async () => {
      try {
        // 🔸 Lấy phần giới thiệu
        const introDoc = await getDoc(doc(db, "library", "introduction"));
        if (introDoc.exists()) {
          setIntro(introDoc.data());
        }

        // 🔸 Lấy danh sách cam
        const querySnap = await getDocs(collection(db, "library_items"));
        const items = querySnap.docs.map((d) => d.data());
        setData(items);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu Firestore:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading)
    return <ActivityIndicator size="large" color="#FF9800" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      {/* 🟢 Phần giới thiệu */}
      {intro && (
        <View style={styles.introCard}>
          {intro.image && (
            <Image
              source={{ uri: intro.image }}
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
            onPress={() => router.push(`/libraryDetail?name=${item.name}`)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.thumbnail} />
              )}
              <Text style={styles.itemText}>{item.name}</Text>
            </View>
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
    marginLeft: 10,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
});
