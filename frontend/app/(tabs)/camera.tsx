import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  // 📸 CHỤP ẢNH
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

  // 🖼️ CHỌN ẢNH TỪ THƯ VIỆN
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Ứng dụng cần quyền truy cập thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      setResult(null);
    }
  };

  // 📤 GỬI ẢNH LÊN BACKEND
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

      const API_URL = "http://192.168.100.5:8000/predict";

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("📩 Server:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setResult({ error: "Không nhận diện được cam" });
        return;
      }

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

  // 🔒 YÊU CẦU QUYỀN CAMERA
  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>Ứng dụng cần quyền truy cập camera</Text>
        <Button title="Cấp quyền" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 📷 CAMERA HOẶC ẢNH */}
      {!photo ? (
        <CameraView ref={cameraRef} style={styles.camera} />
      ) : (
        <Image source={{ uri: photo }} style={styles.preview} />
      )}

      {/* LOADING */}
      {loading && <ActivityIndicator size="large" color="#FF9800" />}

      {/* 🧪 KẾT QUẢ DỰ ĐOÁN */}
      {result && (
        <View style={styles.result}>
          {result.error ? (
            <Text style={[styles.text, { color: "red" }]}>⚠️ {result.error}</Text>
          ) : (
            <>
              <Text style={styles.text}>
                🍊 Độ ngọt: {result.sweetness?.toFixed
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

      {/* CÁC NÚT CHỨC NĂNG */}
      <View style={styles.controls}>
        {!photo ? (
          <>
            <Button title="📸 Chụp ảnh" onPress={takePicture} />
            <Button title="🖼️ Chọn ảnh" onPress={pickImage} />
          </>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { width: "100%", height: "70%" },
  preview: { width: "100%", height: "70%", resizeMode: "cover" },
  controls: { flexDirection: "row", gap: 10, marginTop: 10 },
  result: { marginTop: 20, alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold", color: "#2E7D32" },
});
