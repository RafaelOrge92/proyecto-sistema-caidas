#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// === Configuracion ===
const char* WIFI_SSID = "TU_WIFI";
const char* WIFI_PASS = "TU_PASS";

const char* BASE_URL = "https://TU_BACKEND.com";
const char* DEVICE_ID = "ESP32-001";

// === Heartbeat ===
static void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HB] WiFi not connected");
    return;
  }

  String url = String(BASE_URL) + "/api/v1/devices/heartbeat";

  WiFiClientSecure client;
  client.setInsecure(); // Solo dev. En prod usar CA cert.

  HTTPClient http;
  if (!http.begin(client, url)) {
    Serial.println("[HB] http.begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  int rssi = WiFi.RSSI();
  char payload[256];
  snprintf(
    payload,
    sizeof(payload),
    "{\"deviceId\":\"%s\",\"timestamp\":null,\"battery\":%.2f,\"rssi\":%d,\"fwVersion\":\"%s\"}",
    DEVICE_ID,
    0.82,
    rssi,
    "1.0.0"
  );

  int code = http.POST((uint8_t*)payload, strlen(payload));
  String body = http.getString();

  Serial.printf("[HB] code=%d\n", code);
  Serial.printf("[HB] body=%s\n", body.c_str());

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");

  sendHeartbeat();
}

void loop() {
  delay(60000);
}

