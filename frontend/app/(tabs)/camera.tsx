import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:8000/predict"
    : "http://192.168.100.5:8000/predict";

// ÁNH XẠ ĐỘ NGỌT
type SweetnessInfo = {
  label: string;
  color: string;
};

const getSweetnessInfo = (level: number): SweetnessInfo => {
  if (level <= 2) return { label: "Rất thấp (Chua)", color: "#e53935" };
  if (level <= 4) return { label: "Trung bình thấp", color: "#fb8c00" };
  if (level <= 6) return { label: "Trung bình", color: "#fdd835" };
  if (level <= 8) return { label: "Cao (Ngọt)", color: "#43a047" };
  return { label: "Rất cao (Ngọt đậm)", color: "#1e88e5" };
};

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    sweetness: number;
    confidence: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CHỤP ẢNH
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setResult(null);
      setErrorMsg(null);
    }
  };

  // CHỌN ẢNH
  const pickImage = async () => {
    const permission =
      Platform.OS !== "web"
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : { granted: true };

    if (!permission.granted) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setResult(null);
      setErrorMsg(null);
    }
  };

  // DỰ ĐOÁN
  const predict = async () => {
    if (!imageUri) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const blob = await fetch(imageUri).then((r) => r.blob());
        formData.append("file", blob, "image.png");
      } else {
        formData.append("file", {
          uri: imageUri,
          name: "image.png",
          type: "image/png",
        } as any);
      }

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.is_orange === false) {
        setErrorMsg("Không phải quả cam hoặc ảnh không hợp lệ");
        return;
      }

      setResult({
        sweetness: Number(data.sweetness.toFixed(2)),
        confidence: data.confidence,
      });
    } catch {
      setErrorMsg("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  // RESET
  const resetPrediction = () => {
    setImageUri(null);
    setResult(null);
    setErrorMsg(null);
  };

  // UI TRƯỚC DỰ ĐOÁN
  if (!result) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>🍊 Dự đoán độ ngọt quả cam</Text>

        <View style={styles.imageBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={styles.placeholder}>Chưa có ảnh</Text>
          )}
        </View>

        <View style={styles.row}>
          <Button text="📸 Chụp ảnh" onPress={takePhoto} />
          <Button text="🖼️ Chọn ảnh" onPress={pickImage} />
        </View>

        <Button
          text="🔍 Dự đoán"
          onPress={predict}
          primary
          disabled={!imageUri || loading}
        />

        {loading && (
          <View style={{ marginTop: 12 }}>
            <ActivityIndicator size="large" color="#ff9800" />
            <Text>Đang xử lý ảnh...</Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>
    );
  }

  // UI SAU DỰ ĐOÁN
  const sweetnessInfo = getSweetnessInfo(result.sweetness);
  const confidencePercent = result.confidence * 100;

  return (
    <ScrollView
      contentContainerStyle={styles.resultContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>🍊 Kết quả dự đoán</Text>

      <View style={styles.imageBox}>
        <Image source={{ uri: imageUri! }} style={styles.image} />
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.resultTitle}>Quả cam được chọn</Text>

        <Text style={[styles.resultText, { color: sweetnessInfo.color }]}>
          🍊 Độ ngọt: {result.sweetness}/9
        </Text>

        <Text style={[styles.levelText, { color: sweetnessInfo.color }]}>
          Mức độ: {sweetnessInfo.label}
        </Text>

        <View style={styles.scaleContainer}>
          {[1,2,3,4,5,6,7,8,9].map((n) => (
            <View
              key={n}
              style={[
                styles.scaleItem,
                {
                  backgroundColor:
                    n <= result.sweetness
                      ? sweetnessInfo.color
                      : "#eee",
                },
              ]}
            />
          ))}
        </View>

        <Text style={styles.confidenceText}>
          Độ tin cậy: {confidencePercent.toFixed(1)}%
        </Text>
      </View>

      {}
      <View style={styles.explainBox}>
        <Text style={styles.explainTitle}>📊 Cách hệ thống dự đoán</Text>
        <Text style={styles.explainItem}>
          • YOLOv8n phát hiện tất cả quả cam trong ảnh
        </Text>
        <Text style={styles.explainItem}>
          • Hệ thống chọn quả cam có độ tin cậy cao nhất
        </Text>
        <Text style={styles.explainItem}>
          • UNetLite tách nền quả cam khỏi ảnh
        </Text>
        <Text style={styles.explainItem}>
          • ViT phân loại độ ngọt và suy ra giá trị liên tục 1–9
        </Text>

        <Text style={styles.confidenceExplain}>
          Độ tin cậy (confidence) là xác suất mà mô hình AI gán cho mức độ ngọt
          được dự đoán cao nhất, không đại diện cho độ chính xác tổng thể.
        </Text>
      </View>

      <Button text="🔁 Dự đoán ảnh khác" onPress={resetPrediction} />
    </ScrollView>
  );
}

// BUTTON
const Button = ({ text, onPress, primary, disabled }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      primary && styles.primaryButton,
      disabled && { opacity: 0.5 },
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.buttonText, primary && { color: "#fff" }]}>
      {text}
    </Text>
  </TouchableOpacity>
);

// STYLES
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  resultContainer: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  imageBox: {
    width: 260,
    height: 260,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ffa726",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  image: { width: "100%", height: "100%", borderRadius: 14 },
  placeholder: { color: "#999" },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffa726",
    marginTop: 10,
  },
  primaryButton: { backgroundColor: "#ffa726" },
  buttonText: { color: "#ffa726", fontWeight: "600" },
  resultBox: {
    width: "92%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff3e0",
    alignItems: "center",
    marginBottom: 12,
  },
  resultTitle: { fontWeight: "bold", marginBottom: 4 },
  resultText: { fontSize: 18, fontWeight: "bold" },
  levelText: { marginTop: 4, fontSize: 14, fontWeight: "600" },
  scaleContainer: { flexDirection: "row", marginVertical: 10, width: "100%" },
  scaleItem: { flex: 1, height: 10, marginHorizontal: 2, borderRadius: 5 },
  confidenceText: { fontSize: 13, fontWeight: "600" },
  explainBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "94%",
  },
  explainTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#ef6c00",
  },
  explainItem: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  confidenceExplain: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fdecea",
  },
  errorText: { color: "#d32f2f", fontWeight: "600" },
});
