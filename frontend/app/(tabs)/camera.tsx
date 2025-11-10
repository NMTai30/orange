import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  // 📸 Chụp ảnh
  const takePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      setPhoto(photoData.uri);
      setResult(null);
    }
  };

  // 📤 Gửi ảnh lên server FastAPI
  const sendToServer = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: photo,
        name: "image.jpg",
        type: "image/jpeg",
      } as any);

      const API_URL = "http://192.168.100.5:8000/predict"; // ⚠️ IP của máy backend
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("📩 Server response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setResult({ error: "Không nhận diện được cam" });
        return;
      }

      // Nếu backend trả lỗi hoặc không có trường sweetness
      if (data.error || data.sweetness === undefined) {
        setResult({ error: "Không nhận diện được cam" });
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error("❌ Lỗi kết nối:", err);
      setResult({ error: "Không thể kết nối tới server" });
    } finally {
      setLoading(false);
    }
  };

  // 🔒 Nếu chưa cấp quyền camera
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>Ứng dụng cần quyền truy cập camera</Text>
        <Button title="Cấp quyền" onPress={requestPermission} />
      </View>
    );
  }

  // 📱 Giao diện chính
  return (
    <View style={styles.container}>
      {!photo ? (
        <CameraView ref={cameraRef} style={styles.camera} />
      ) : (
        <Image source={{ uri: photo }} style={styles.preview} />
      )}

      {loading && <ActivityIndicator size="large" color="#FF9800" />}

      {result && (
        <View style={styles.result}>
          {result.error ? (
            <Text style={[styles.text, { color: "red" }]}>
              ⚠️ {result.error}
            </Text>
          ) : (
            <>
              <Text style={styles.text}>
                🍊 Độ ngọt:{" "}
                {result.sweetness?.toFixed
                  ? result.sweetness.toFixed(2)
                  : result.sweetness}
              </Text>
              <Text style={styles.text}>
                🔍 Độ tin cậy:{" "}
                {result.confidence
                  ? (result.confidence * 100).toFixed(1) + "%"
                  : "N/A"}
              </Text>
            </>
          )}
        </View>
      )}

      <View style={styles.controls}>
        {!photo ? (
          <Button title="📸 Chụp ảnh" onPress={takePicture} />
        ) : (
          <>
            <Button title="📤 Dự đoán" onPress={sendToServer} />
            <Button
              title="🔁 Chụp lại"
              onPress={() => {
                setPhoto(null);
                setResult(null);
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { width: "100%", height: "70%" },
  preview: { width: "100%", height: "70%", resizeMode: "cover" },
  controls: { flexDirection: "row", gap: 10, marginTop: 10 },
  result: { marginTop: 20, alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold", color: "#2E7D32" },
});
