import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍊 Ứng dụng Phân tích độ ngọt của Cam</Text>
      <Text style={styles.desc}>
        Sử dụng AI để dự đoán độ ngọt và xem thư viện cam được phân loại.
      </Text>
      <Button title="Bắt đầu dự đoán" onPress={() => router.push("/(tabs)/camera")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  desc: { fontSize: 16, textAlign: "center", marginBottom: 30 },
});
