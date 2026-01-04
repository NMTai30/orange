import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {}
      <View style={styles.card}>
        {}
        <Text style={styles.icon}>🍊</Text>

        {}
        <Text style={styles.title}>
          Ứng dụng Phân tích độ ngọt của Cam
        </Text>

        {}
        <Text style={styles.desc}>
          Sử dụng trí tuệ nhân tạo (AI) để dự đoán mức độ ngọt của quả cam
          từ hình ảnh và khám phá thư viện các giống cam phổ biến.
        </Text>

        {}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(tabs)/camera")}
        >
          <Text style={styles.buttonText}>BẮT ĐẦU DỰ ĐOÁN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 26,
    borderRadius: 18,
    alignItems: "center",

    elevation: 4, // Android
    shadowColor: "#fff", // iOS
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  icon: {
    fontSize: 56,
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 12,
  },

  desc: {
    fontSize: 15,
    textAlign: "center",
    color: "#666",
    lineHeight: 22,
    marginBottom: 28,
  },

  button: {
    width: "100%",
    backgroundColor: "#2196f3",
    paddingVertical: 14,
    borderRadius: 30,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
