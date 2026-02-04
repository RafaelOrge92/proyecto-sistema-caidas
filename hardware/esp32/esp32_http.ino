#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <esp_system.h>

// === Configuracion ===
const char* WIFI_SSID = "TU_WIFI";
const char* WIFI_PASS = "TU_PASS";

const char* BASE_URL = "http://TU_BACKEND.com";
const char* DEVICE_ID = "ESP32-001";

// =====================
// Boton (GPIO 25)
// =====================
static const int BUTTON_PIN = 25;
static const uint32_t DEBOUNCE_MS = 40;
static const uint32_t COOLDOWN_MS = 800;
static int lastStable = HIGH;
static int lastReading = HIGH;
static uint32_t lastChangeMs = 0;
static uint32_t lastFireMs = 0;

// =====================
// Heartbeat (siempre activo)
// =====================
static const uint32_t HEARTBEAT_MS = 120000; // 2 min

// =====================
// Bateria (ADC)
// =====================
// No hay bateria en esta version. Se envia battery: null.

// =====================
// Tiempo UTC (NTP)
// =====================
static const char* NTP1 = "pool.ntp.org";
static const char* NTP2 = "time.google.com";

static void setupTime() {
  configTime(0, 0, NTP1, NTP2);
  Serial.print("[TIME] sync");
  time_t now = 0;
  uint32_t t0 = millis();
  while (now < 1700000000 && millis() - t0 < 15000) { // espera max 15s
    delay(500);
    Serial.print(".");
    time(&now);
  }
  Serial.println();
  if (now >= 1700000000) {
    Serial.println("[TIME] OK");
  } else {
    Serial.println("[TIME] FAIL (sin NTP)");
  }
}

static String utcIsoNow() {
  time_t now;
  time(&now);
  if (now < 1700000000) {
    return "null";
  }
  struct tm t;
  gmtime_r(&now, &t);
  char buf[32];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &t);
  return String(buf);
}

// =====================
// UUID v4
// =====================
static String uuid_v4() {
  uint8_t b[16];
  for (int i = 0; i < 16; i++) {
    b[i] = (uint8_t)(esp_random() & 0xFF);
  }
  b[6] = (b[6] & 0x0F) | 0x40; // version 4
  b[8] = (b[8] & 0x3F) | 0x80; // variant 10xx

  char buf[37];
  snprintf(
    buf, sizeof(buf),
    "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
    b[0], b[1], b[2], b[3],
    b[4], b[5],
    b[6], b[7],
    b[8], b[9],
    b[10], b[11], b[12], b[13], b[14], b[15]
  );
  return String(buf);
}

// =====================
// Heartbeat
// =====================
static void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HB] WiFi not connected");
    return;
  }

  String url = String(BASE_URL) + "/api/v1/devices/heartbeat";

  WiFiClient client;
  HTTPClient http;

  if (!http.begin(client, url)) {
    Serial.println("[HB] http.begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  int rssi = WiFi.RSSI();
  String ts = utcIsoNow();

  char payload[256];
  if (ts == "null") {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"timestamp\":null,\"battery\":null,\"rssi\":%d,\"fwVersion\":\"%s\"}",
      DEVICE_ID,
      rssi,
      "1.0.0"
    );
  } else {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"timestamp\":\"%s\",\"battery\":null,\"rssi\":%d,\"fwVersion\":\"%s\"}",
      DEVICE_ID,
      ts.c_str(),
      rssi,
      "1.0.0"
    );
  }

  int code = http.POST((uint8_t*)payload, strlen(payload));
  String body = http.getString();

  Serial.printf("[HB] code=%d\n", code);
  Serial.printf("[HB] body=%s\n", body.c_str());

  http.end();
}

// =====================
// Evento boton (EMERGENCY_BUTTON)
// =====================
static void sendEmergencyEvent() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[EV] WiFi not connected");
    return;
  }

  String eventUid = uuid_v4();
  String ts = utcIsoNow();

  String url = String(BASE_URL) + "/api/v1/events/ingest";
  WiFiClient client;
  HTTPClient http;

  if (!http.begin(client, url)) {
    Serial.println("[EV] http.begin failed");
    return;
  }
  http.addHeader("Content-Type", "application/json");

  char payload[256];
  if (ts == "null") {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"eventUid\":\"%s\",\"eventType\":\"EMERGENCY_BUTTON\",\"occurredAt\":null}",
      DEVICE_ID,
      eventUid.c_str()
    );
  } else {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"eventUid\":\"%s\",\"eventType\":\"EMERGENCY_BUTTON\",\"occurredAt\":\"%s\"}",
      DEVICE_ID,
      eventUid.c_str(),
      ts.c_str()
    );
  }

  // Reintentos basicos (1s, 3s, 10s) con el MISMO eventUid
  const uint32_t delays[3] = {1000, 3000, 10000};
  for (int i = 0; i < 3; i++) {
    int code = http.POST((uint8_t*)payload, strlen(payload));
    String body = http.getString();
    Serial.printf("[EV] try=%d code=%d\n", i + 1, code);
    Serial.printf("[EV] body=%s\n", body.c_str());

    if (code >= 200 && code < 300) {
      break;
    }
    delay(delays[i]);
  }

  http.end();
}

// =====================
// Debounce boton
// =====================
static bool buttonPressedEdge() {
  int reading = digitalRead(BUTTON_PIN);
  uint32_t now = millis();

  if (reading != lastReading) {
    lastChangeMs = now;
    lastReading = reading;
  }

  if ((now - lastChangeMs) > DEBOUNCE_MS) {
    if (lastStable != reading) {
      lastStable = reading;
      if (lastStable == LOW) { // pullup
        if (now - lastFireMs > COOLDOWN_MS) {
          lastFireMs = now;
          return true;
        }
      }
    }
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");

  setupTime();
  sendHeartbeat();
}

void loop() {
  static uint32_t lastHb = 0;
  uint32_t now = millis();
  if (now - lastHb > HEARTBEAT_MS) {
    lastHb = now;
    sendHeartbeat();
  }

  if (buttonPressedEdge()) {
    Serial.println("[BTN] Pulsado -> enviando EMERGENCY_BUTTON");
    sendEmergencyEvent();
  }

  delay(5);
}
