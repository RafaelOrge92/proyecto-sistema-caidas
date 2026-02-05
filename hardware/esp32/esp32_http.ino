#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <esp_system.h>
#include <Preferences.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_task_wdt.h"
#include "esp_idf_version.h"

// === Configuracion ===
const char* WIFI_SSID = "TU_WIFI";
const char* WIFI_PASS = "TU_PASS";

const char* BASE_URL = "http://TU_BACKEND.com";
// Si esta vacio, se usa MAC y se guarda en NVS
const char* DEVICE_ID_OVERRIDE = "";

// =====================
// Cola persistente (NVS)
// =====================
static const uint8_t MAX_QUEUE = 10;
static const char* NVS_NS = "eventq";
static Preferences prefs;
static String queue[MAX_QUEUE];
static uint8_t qCount = 0;
static uint8_t qAttempts[MAX_QUEUE];
static uint32_t qNextMs[MAX_QUEUE];

// =====================
// Device ID (MAC -> NVS)
// =====================
static String deviceId;

static bool isInvalidDeviceId(const String& id) {
  return id.length() == 0 || id == "ESP32-000000000000";
}

static String makeDeviceIdFromEfuse() {
  uint64_t mac = ESP.getEfuseMac(); // 48-bit base MAC
  uint8_t b[6];
  for (int i = 0; i < 6; i++) {
    b[5 - i] = (mac >> (i * 8)) & 0xFF;
  }
  char buf[32];
  snprintf(
    buf,
    sizeof(buf),
    "ESP32-%02X%02X%02X%02X%02X%02X",
    b[0], b[1], b[2], b[3], b[4], b[5]
  );
  return String(buf);
}

static void initDeviceId() {
  if (DEVICE_ID_OVERRIDE[0] != '\0') {
    deviceId = String(DEVICE_ID_OVERRIDE);
    return;
  }
  String stored = prefs.getString("device_id", "");
  if (!isInvalidDeviceId(stored)) {
    deviceId = stored;
    return;
  }
  deviceId = makeDeviceIdFromEfuse();
  prefs.putString("device_id", deviceId);
}

// =====================
// LED estado (ajusta segun placa)
// =====================
static const int LED_PIN = 2;         // many ESP32 devkits
static const bool LED_ACTIVE_LOW = true;
static bool ledState = false;
static uint32_t lastLedMs = 0;

static void ledWrite(bool on) {
  digitalWrite(LED_PIN, LED_ACTIVE_LOW ? !on : on);
}

static void updateLed(uint32_t now) {
  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastLedMs > 500) {
      lastLedMs = now;
      ledState = !ledState;
      ledWrite(ledState);
    }
    return;
  }

  if (qCount > 0) {
    if (now - lastLedMs > 200) {
      lastLedMs = now;
      ledState = !ledState;
      ledWrite(ledState);
    }
    return;
  }

  if (!ledState) {
    ledState = true;
    ledWrite(true);
  }
}

// =====================
// Boton (GPIO 25) - IRQ
// =====================
static const int BUTTON_PIN = 25;
static const uint32_t ISR_DEBOUNCE_MS = 60;
static volatile uint32_t lastIsrMs = 0;
static volatile uint8_t pendingButton = 0;

// =====================
// Heartbeat (siempre activo)
// =====================
static const uint32_t HEARTBEAT_MS = 120000; // 2 min

// =====================
// WiFi recovery + WDT
// =====================
static const uint32_t WIFI_RETRY_MS = 10000;   // reintento WiFi cada 10s
static const uint32_t WIFI_RESTART_MS = 120000; // reinicio si 2 min sin WiFi
static const int WDT_TIMEOUT_S = 15;           // evita pelear con POST (timeout 5s)
static uint32_t lastWifiOkMs = 0;
static uint32_t lastWifiRetryMs = 0;
static bool wdtEnabled = false;

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
    esp_task_wdt_reset();
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
// Cola persistente
// =====================
static void saveQueue() {
  prefs.putUChar("count", qCount);
  for (uint8_t i = 0; i < qCount; i++) {
    char key[8];
    snprintf(key, sizeof(key), "q%u", i);
    prefs.putString(key, queue[i]);
  }
  for (uint8_t i = qCount; i < MAX_QUEUE; i++) {
    char key[8];
    snprintf(key, sizeof(key), "q%u", i);
    prefs.remove(key);
  }
}

static void loadQueue() {
  qCount = prefs.getUChar("count", 0);
  if (qCount > MAX_QUEUE) qCount = MAX_QUEUE;
  for (uint8_t i = 0; i < qCount; i++) {
    char key[8];
    snprintf(key, sizeof(key), "q%u", i);
    queue[i] = prefs.getString(key, "");
    if (queue[i].length() == 0) {
      qCount = i;
      break;
    }
    qAttempts[i] = 0;
    qNextMs[i] = 0;
  }
}

static void dropOldest() {
  if (qCount == 0) return;
  for (uint8_t i = 1; i < qCount; i++) {
    queue[i - 1] = queue[i];
    qAttempts[i - 1] = qAttempts[i];
    qNextMs[i - 1] = qNextMs[i];
  }
  qCount--;
  saveQueue();
}

static void enqueueEvent(const String& payload) {
  if (qCount >= MAX_QUEUE) {
    Serial.println("[QUEUE] full, dropping oldest");
    dropOldest();
  }
  queue[qCount] = payload;
  qAttempts[qCount] = 0;
  qNextMs[qCount] = 0;
  qCount++;
  saveQueue();
}

static uint32_t retryDelayMs(uint8_t attempt) {
  if (attempt == 1) return 1000;
  if (attempt == 2) return 3000;
  if (attempt == 3) return 10000;
  return 60000;
}

// =====================
// WDT init (compatible con IDF v4/v5)
// =====================
static void initWdt() {
#if ESP_IDF_VERSION_MAJOR >= 5
  esp_task_wdt_config_t cfg = {};
  cfg.timeout_ms = (uint32_t)WDT_TIMEOUT_S * 1000;
  cfg.idle_core_mask = 0;
  cfg.trigger_panic = true;
  esp_task_wdt_init(&cfg);
#else
  esp_task_wdt_init(WDT_TIMEOUT_S, true);
#endif
  esp_task_wdt_add(NULL);
  wdtEnabled = true;
}

static void wdtPause() {
  if (!wdtEnabled) return;
  esp_task_wdt_delete(NULL);
  wdtEnabled = false;
}

static void wdtResume() {
  if (wdtEnabled) return;
  esp_task_wdt_add(NULL);
  wdtEnabled = true;
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
// ISR boton
// =====================
void IRAM_ATTR onButtonFall() {
  uint32_t now = (uint32_t)(xTaskGetTickCountFromISR() * portTICK_PERIOD_MS);
  if (now - lastIsrMs < ISR_DEBOUNCE_MS) return;
  lastIsrMs = now;
  if (pendingButton < 255) {
    pendingButton++;
  }
}

// =====================
// Heartbeat
// =====================
static void sendHeartbeat() {
  esp_task_wdt_reset();
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HB] WiFi not connected");
    return;
  }

  String url = String(BASE_URL) + "/api/v1/devices/heartbeat";

  WiFiClient client;
  HTTPClient http;

  wdtPause();
  if (!http.begin(client, url)) {
    wdtResume();
    Serial.println("[HB] http.begin failed");
    return;
  }
  http.setTimeout(5000);

  http.addHeader("Content-Type", "application/json");

  int rssi = WiFi.RSSI();
  String ts = utcIsoNow();

  char payload[256];
  if (ts == "null") {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"timestamp\":null,\"battery\":null,\"rssi\":%d,\"fwVersion\":\"%s\"}",
      deviceId.c_str(),
      rssi,
      "1.0.0"
    );
  } else {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"timestamp\":\"%s\",\"battery\":null,\"rssi\":%d,\"fwVersion\":\"%s\"}",
      deviceId.c_str(),
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
  wdtResume();
  esp_task_wdt_reset();
}

// =====================
// Evento boton (EMERGENCY_BUTTON)
// =====================
static void enqueueEmergencyEvent() {
  String eventUid = uuid_v4();
  String ts = utcIsoNow();

  char payload[256];
  if (ts == "null") {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"eventUid\":\"%s\",\"eventType\":\"EMERGENCY_BUTTON\",\"occurredAt\":null}",
      deviceId.c_str(),
      eventUid.c_str()
    );
  } else {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"eventUid\":\"%s\",\"eventType\":\"EMERGENCY_BUTTON\",\"occurredAt\":\"%s\"}",
      deviceId.c_str(),
      eventUid.c_str(),
      ts.c_str()
    );
  }

  enqueueEvent(String(payload));
  Serial.printf("[EV] queued uid=%s count=%u\n", eventUid.c_str(), qCount);
}

// =====================
// Procesar cola de eventos
// =====================
static void processQueue() {
  esp_task_wdt_reset();
  if (qCount == 0) return;
  if (WiFi.status() != WL_CONNECTED) return;

  uint32_t now = millis();
  if (now < qNextMs[0]) return;

  String url = String(BASE_URL) + "/api/v1/events/ingest";
  WiFiClient client;
  HTTPClient http;

  wdtPause();
  if (!http.begin(client, url)) {
    wdtResume();
    Serial.println("[QUEUE] http.begin failed");
    qAttempts[0]++;
    qNextMs[0] = now + retryDelayMs(qAttempts[0]);
    return;
  }
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST((uint8_t*)queue[0].c_str(), queue[0].length());
  String body = http.getString();
  Serial.printf("[QUEUE] code=%d\n", code);
  Serial.printf("[QUEUE] body=%s\n", body.c_str());

  http.end();
  wdtResume();
  esp_task_wdt_reset();

  if (code >= 200 && code < 300) {
    dropOldest();
    return;
  }

  if (code >= 400 && code < 500) {
    Serial.println("[QUEUE] 4xx, dropping event");
    dropOldest();
    return;
  }

  qAttempts[0]++;
  qNextMs[0] = now + retryDelayMs(qAttempts[0]);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  initWdt();

  pinMode(LED_PIN, OUTPUT);
  ledWrite(false);

  WiFi.mode(WIFI_STA);

  prefs.begin(NVS_NS, false);
  initDeviceId();
  loadQueue();
  Serial.printf("[QUEUE] loaded %u pending\n", qCount);
  Serial.printf("[ID] deviceId=%s\n", deviceId.c_str());

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButtonFall, FALLING);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("WiFi");
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 30000) {
    esp_task_wdt_reset();
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" connected");
    lastWifiOkMs = millis();
  } else {
    Serial.println(" initial connect failed, will retry in loop");
  }

  setupTime();
  sendHeartbeat();
}

void loop() {
  static uint32_t lastHb = 0;
  uint32_t now = millis();
  esp_task_wdt_reset();

  if (WiFi.status() == WL_CONNECTED) {
    lastWifiOkMs = now;
  } else {
    if (now - lastWifiRetryMs > WIFI_RETRY_MS) {
      lastWifiRetryMs = now;
      Serial.println("[WIFI] reconnecting...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    }
    if (lastWifiOkMs != 0 && now - lastWifiOkMs > WIFI_RESTART_MS) {
      Serial.println("[WIFI] down too long, restarting");
      delay(100);
      ESP.restart();
    }
  }

  if (now - lastHb > HEARTBEAT_MS) {
    lastHb = now;
    sendHeartbeat();
  }

  if (pendingButton > 0) {
    noInterrupts();
    uint8_t count = pendingButton;
    pendingButton = 0;
    interrupts();
    for (uint8_t i = 0; i < count; i++) {
      Serial.println("[BTN] IRQ -> encolando EMERGENCY_BUTTON");
      enqueueEmergencyEvent();
    }
  }

  static uint32_t lastQueueTick = 0;
  if (now - lastQueueTick > 500) {
    lastQueueTick = now;
    processQueue();
  }

  updateLed(now);
  delay(5);
}
