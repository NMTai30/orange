import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:8000/predict"
    : "http://192.168.100.5:8000/predict";

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ===============================
  // 📸 CHỤP ẢNH
  // ===============================
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

  // ===============================
  // 🖼️ CHỌN ẢNH
  // ===============================
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

  // ===============================
  // 🍊 DỰ ĐOÁN
  // ===============================
  const predict = async () => {
    if (!imageUri) return;

    setLoading(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const blob = await fetch(imageUri).then(r => r.blob());
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
        setErrorMsg("❌ Không phải quả cam hoặc ảnh không hợp lệ");
        return;
      }

      setResult(data);
    } catch (err) {
      setErrorMsg("❌ Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🎨 UI
  // ===============================
  return (
    <View style={styles.container}>
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
        disabled={!imageUri || loading}
        primary
      />

      {loading && (
        <View style={{ marginTop: 15 }}>
          <ActivityIndicator size="large" color="#ff9800" />
          <Text>Đang xử lý ảnh...</Text>
        </View>
      )}

      {/* ❌ LỖI / KHÔNG PHẢI CAM */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* ✅ KẾT QUẢ */}
      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Kết quả dự đoán</Text>
          <Text style={styles.resultText}>
            🍊 Độ ngọt: {result.sweetness}
          </Text>
          <Text>Confidence: {result.confidence}</Text>
        </View>
      )}
    </View>
  );
}

// ===============================
// 🔘 BUTTON COMPONENT
// ===============================
const Button = ({
  text,
  onPress,
  primary,
  disabled,
}: any) => (
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

// ===============================
// 🎨 STYLES
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  imageBox: {
    width: 260,
    height: 260,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffa726",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  placeholder: {
    color: "#999",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffa726",
  },
  primaryButton: {
    backgroundColor: "#ffa726",
    marginTop: 5,
  },
  buttonText: {
    color: "#ffa726",
    fontWeight: "600",
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#fff3e0",
    alignItems: "center",
  },
  resultTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  resultText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ef6c00",
  },
  errorBox: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fdecea",
  },
  errorText: {
    color: "#d32f2f",
    fontWeight: "600",
  },
});
