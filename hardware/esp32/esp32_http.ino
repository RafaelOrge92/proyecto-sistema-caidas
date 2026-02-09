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

// === TILT SENSOR BEGIN ===
// =====================
// Inclinometro KY-017 (interruptor mecanico)
// =====================
static const int TILT_PIN = 26;              // GPIO libre por defecto
static const bool TILT_USE_PULLUP = true;    // lectura robusta
static const bool TILT_ACTIVE_LOW = true;    // configurable segun modulo
static const uint32_t TILT_DEBOUNCE_MS = 150; // antirrebote (mas estricto)
static const uint32_t TILT_HOLD_MS = 2000;   // inclinacion valida si se mantiene
static const uint32_t TILT_COOLDOWN_MS = 3000; // evita spam
static const bool TILT_REPORT_NORMAL = false; // NO enviar tilted:false (se ignora el retorno a normal)
static const char* TILT_ENDPOINT = "/api/v1/events/ingest";
static const char* TILT_EVENT_TYPE = "TILT";

static bool TILT_lastReading = false;
static bool TILT_stableReading = false;
static bool TILT_reportedState = false;
static bool TILT_hasTilted = false;
static uint32_t TILT_lastChangeMs = 0;
static uint32_t TILT_holdStartMs = 0;
static uint32_t TILT_lastEventMs = 0;
// === TILT SENSOR END ===

// === IMU FALL BEGIN ===
#include <Wire.h>

// =====================
// MPU6050 (I2C) - deteccion de caida (FALL)
// =====================
static const uint8_t IMU_ADDR = 0x68;
static const uint8_t IMU_REG_PWR_MGMT_1 = 0x6B;
static const uint8_t IMU_REG_WHO_AM_I = 0x75;
static const uint8_t IMU_REG_ACCEL_CONFIG = 0x1C;
static const uint8_t IMU_REG_GYRO_CONFIG = 0x1B;
static const uint8_t IMU_REG_CONFIG = 0x1A;
static const uint8_t IMU_REG_ACCEL_XOUT_H = 0x3B;

static const bool IMU_USE_WIRE_BEGIN = true;  // usa Wire.begin(21,22) si no hay otra inicializacion
static const uint8_t IMU_SDA = 21;
static const uint8_t IMU_SCL = 22;

// Rango establecido: acelerometro ±8g (AFS_SEL=2)
static const uint8_t IMU_ACCEL_CFG = 0x10;
static const float IMU_ACCEL_LSB_PER_G = 4096.0f;
// Gyro ±500 dps (FS_SEL=1)
static const uint8_t IMU_GYRO_CFG = 0x08;
// DLPF ~44Hz
static const uint8_t IMU_DLPF_CFG = 0x03;

static const uint32_t IMU_SAMPLE_MS = 20; // 50 Hz
static const float IMU_LPF_ALPHA = 0.2f;  // filtro simple para |a|
static const bool IMU_DEBUG = false;
static const uint32_t IMU_DEBUG_MS = 200;
// Evita spam de logs I2C cuando el IMU esta desconectado/inestable.
static const bool IMU_DISABLE_ON_I2C_ERRORS = true;
static const uint8_t IMU_MAX_CONSECUTIVE_READ_FAILS = 5;

// Umbrales y ventanas
// Ajustes para reducir falsos positivos en movimientos "en ondas"
// Perfil demo: mas sensible para caidas pequenas
// Ajustado a -15% de sensibilidad y con bloqueo por "subida"
static const float FALL_FREEFALL_G_MAX = 0.47f;
static const uint32_t FALL_FREEFALL_MIN_MS = 14;
static const uint32_t FALL_FREEFALL_MAX_MS = 1000;
// Free-fall "suave" para caidas cortas (requiere stillness mas estricto)
static const float FALL_SOFT_FREEFALL_G_MAX = 0.72f;
static const uint32_t FALL_SOFT_FREEFALL_MIN_MS = 23;
static const float FALL_IMPACT_G_MIN = 1.32f;
// Impacto suave (para caidas bajas). Requiere stillness mas estricto.
static const float FALL_SOFT_IMPACT_G_MIN = 0.69f;
static const uint32_t FALL_IMPACT_MAX_MS_AFTER_FREEFALL = 2000;
static const uint32_t FALL_POST_STILL_MIN_MS = 575;
static const uint32_t FALL_POST_STILL_MAX_MS = 7000;
static const float FALL_STILL_DELTA_MAX = 0.38f;
static const uint32_t FALL_SOFT_STILL_MIN_MS = 920;
static const float FALL_SOFT_STILL_DELTA_MAX = 0.30f;
// Ignora el pico inicial del impacto antes de evaluar "stillness"
static const uint32_t FALL_POST_SETTLE_MS = 288;
static const uint32_t FALL_SOFT_POST_SETTLE_MS = 460;
// Bloqueo temporal tras una subida (evita falsos positivos al levantar)
static const float FALL_LIFT_G_MIN = 1.25f;
static const uint32_t FALL_LIFT_BLOCK_MS = 350;
static const uint32_t FALL_COOLDOWN_MS = 8000;
// Evita falsos positivos al levantar el dispositivo:
// desactiva "impact-only" y exige free-fall antes del impacto.
static const bool FALL_IMPACT_ONLY_ENABLE = false;
static const float FALL_IMPACT_ONLY_G_MIN = 2.20f; // sin uso si impact-only esta deshabilitado
// Requiere "stillness" post-impacto para confirmar (menos falsos positivos).
static const bool FALL_SIMULATION_MODE = false;

// Samples
static const uint16_t FALL_PRE_SAMPLES = 100;  // ~2s
static const uint16_t FALL_POST_SAMPLES = 100; // ~2s
static const uint16_t FALL_MAX_SAMPLES = FALL_PRE_SAMPLES + FALL_POST_SAMPLES;

// Endpoints
static const char* FALL_HEADER_ENDPOINT = "/api/v1/events/ingest";
static const char* FALL_SAMPLES_ENDPOINT = "/api/v1/events/samples"; // backend puede no existir aun

// NVS para persistencia minima del header
static const char* IMU_NVS_NS = "fallq";
static Preferences imuPrefs;

enum IMU_FallState {
  IMU_IDLE = 0,
  IMU_FREEFALL,
  IMU_IMPACT,
  IMU_POST_IMPACT,
  IMU_CONFIRMED,
  IMU_COOLDOWN
};

static IMU_FallState IMU_state = IMU_IDLE;
static uint32_t IMU_stateSinceMs = 0;
static uint32_t IMU_lastSampleMs = 0;
static float IMU_magFilt = 1.0f;

// post-impact stillness tracking
static float IMU_postMagMin = 10.0f;
static float IMU_postMagMax = 0.0f;

// pre-trigger ring buffer
static float IMU_preAx[FALL_PRE_SAMPLES];
static float IMU_preAy[FALL_PRE_SAMPLES];
static float IMU_preAz[FALL_PRE_SAMPLES];
static uint16_t IMU_preIdx = 0;
static uint16_t IMU_preCount = 0;

// samples buffer for sending
static float IMU_samplesAx[FALL_MAX_SAMPLES];
static float IMU_samplesAy[FALL_MAX_SAMPLES];
static float IMU_samplesAz[FALL_MAX_SAMPLES];
static int16_t IMU_samplesTms[FALL_MAX_SAMPLES];
static uint16_t IMU_samplesCount = 0;
static bool IMU_capturingPost = false;
static uint16_t IMU_postCaptured = 0;

// event + queue flags
static String IMU_eventUid = "";
static String IMU_eventTs = "null";
static bool IMU_pendingHeader = false;
static bool IMU_pendingSamples = false;
static bool IMU_samplesReady = false;
static uint8_t IMU_headerAttempts = 0;
static uint8_t IMU_samplesAttempts = 0;
static uint32_t IMU_nextHeaderAttemptMs = 0;
static uint32_t IMU_nextSamplesAttemptMs = 0;

static uint32_t IMU_lastLogMs = 0;
static uint32_t IMU_lastDebugMs = 0;
static uint32_t IMU_lastFfLogMs = 0;
static uint32_t IMU_lastLiftMs = 0;
static uint32_t IMU_lastLiftLogMs = 0;
static bool IMU_impactFromIdle = false;
static bool IMU_softImpact = false;
static bool IMU_softFreefall = false;
static bool IMU_postSettled = false;
<<<<<<< Updated upstream
=======
static bool IMU_present = false;
static bool IMU_disabledByReadErrors = false;
static uint8_t IMU_readFailStreak = 0;
>>>>>>> Stashed changes

static void IMU_logEvent(const char* event) {
  Serial.printf("{\"type\":\"imu\",\"event\":\"%s\"}\n", event);
}

static void IMU_logEventU32(const char* event, const char* key, uint32_t value) {
  Serial.printf("{\"type\":\"imu\",\"event\":\"%s\",\"%s\":%lu}\n", event, key, (unsigned long)value);
}

static void IMU_logEventI32(const char* event, const char* key, int32_t value) {
  Serial.printf("{\"type\":\"imu\",\"event\":\"%s\",\"%s\":%ld}\n", event, key, (long)value);
}

static void IMU_logState(uint8_t st, uint32_t now) {
  if (now - IMU_lastLogMs < 1000) return;
  IMU_lastLogMs = now;
  const char* name = "UNKNOWN";
  switch ((IMU_FallState)st) {
    case IMU_IDLE: name = "IDLE"; break;
    case IMU_FREEFALL: name = "FREEFALL"; break;
    case IMU_IMPACT: name = "IMPACT"; break;
    case IMU_POST_IMPACT: name = "POST_IMPACT"; break;
    case IMU_CONFIRMED: name = "CONFIRMED"; break;
    case IMU_COOLDOWN: name = "COOLDOWN"; break;
  }
  Serial.printf("{\"type\":\"imu\",\"event\":\"state\",\"state\":\"%s\"}\n", name);
}

static void IMU_logDebug(float ax, float ay, float az, float magRaw, float magFilt, uint32_t now) {
  if (!IMU_DEBUG) return;
  if (now - IMU_lastDebugMs < IMU_DEBUG_MS) return;
  IMU_lastDebugMs = now;
  Serial.printf(
    "{\"type\":\"imu\",\"event\":\"sample\",\"ax\":%.2f,\"ay\":%.2f,\"az\":%.2f,\"mag\":%.2f,\"filt\":%.2f}\n",
    ax,
    ay,
    az,
    magRaw,
    magFilt
  );
}

static void IMU_logFreefall(float magRaw, uint32_t ffMs, uint32_t now) {
  if (!IMU_DEBUG) return;
  if (now - IMU_lastFfLogMs < 1000) return;
  IMU_lastFfLogMs = now;
  Serial.printf(
    "{\"type\":\"imu\",\"event\":\"freefall\",\"mag\":%.2f,\"ffMs\":%lu}\n",
    magRaw,
    (unsigned long)ffMs
  );
}

static bool IMU_writeReg(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(IMU_ADDR);
  Wire.write(reg);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

static bool IMU_readReg(uint8_t reg, uint8_t& value) {
  Wire.beginTransmission(IMU_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((int)IMU_ADDR, 1) != 1) return false;
  value = Wire.read();
  return true;
}

static bool IMU_readBlock(uint8_t reg, uint8_t* buf, uint8_t len) {
  Wire.beginTransmission(IMU_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((int)IMU_ADDR, (int)len) != len) return false;
  for (uint8_t i = 0; i < len; i++) {
    buf[i] = Wire.read();
  }
  return true;
}

static bool IMU_readAccelGyro(float& ax, float& ay, float& az) {
  uint8_t b[14];
  if (!IMU_readBlock(IMU_REG_ACCEL_XOUT_H, b, 14)) return false;
  int16_t rawAx = (int16_t)((b[0] << 8) | b[1]);
  int16_t rawAy = (int16_t)((b[2] << 8) | b[3]);
  int16_t rawAz = (int16_t)((b[4] << 8) | b[5]);
  ax = rawAx / IMU_ACCEL_LSB_PER_G;
  ay = rawAy / IMU_ACCEL_LSB_PER_G;
  az = rawAz / IMU_ACCEL_LSB_PER_G;
  return true;
}

static void IMU_savePendingToNvs() {
  imuPrefs.putBool("hdr_pending", IMU_pendingHeader);
  imuPrefs.putString("event_uid", IMU_eventUid);
  imuPrefs.putString("event_ts", IMU_eventTs);
}

static void IMU_loadPendingFromNvs() {
  IMU_pendingHeader = imuPrefs.getBool("hdr_pending", false);
  IMU_eventUid = imuPrefs.getString("event_uid", "");
  IMU_eventTs = imuPrefs.getString("event_ts", "null");
}

static void IMU_resetState(uint8_t st, uint32_t now) {
  IMU_state = (IMU_FallState)st;
  IMU_stateSinceMs = now;
  if (IMU_state == IMU_IDLE) {
    IMU_softFreefall = false;
    IMU_softImpact = false;
    IMU_postSettled = false;
  }
  if (IMU_state == IMU_IMPACT) {
    IMU_softImpact = false;
  }
  if (IMU_state == IMU_POST_IMPACT) {
    IMU_postSettled = false;
  }
  IMU_logState(IMU_state, now);
}

static void IMU_bufferPre(float ax, float ay, float az) {
  IMU_preAx[IMU_preIdx] = ax;
  IMU_preAy[IMU_preIdx] = ay;
  IMU_preAz[IMU_preIdx] = az;
  IMU_preIdx = (IMU_preIdx + 1) % FALL_PRE_SAMPLES;
  if (IMU_preCount < FALL_PRE_SAMPLES) IMU_preCount++;
}

static void IMU_buildSamplesFromPre() {
  IMU_samplesCount = 0;
  if (IMU_preCount == 0) return;
  uint16_t start = (IMU_preCount == FALL_PRE_SAMPLES) ? IMU_preIdx : 0;
  for (uint16_t i = 0; i < IMU_preCount; i++) {
    uint16_t idx = (start + i) % FALL_PRE_SAMPLES;
    IMU_samplesAx[IMU_samplesCount] = IMU_preAx[idx];
    IMU_samplesAy[IMU_samplesCount] = IMU_preAy[idx];
    IMU_samplesAz[IMU_samplesCount] = IMU_preAz[idx];
    IMU_samplesTms[IMU_samplesCount] = (int16_t)((int32_t)i - (int32_t)IMU_preCount) * (int16_t)IMU_SAMPLE_MS;
    IMU_samplesCount++;
  }
}

static void IMU_appendPostSample(float ax, float ay, float az) {
  if (IMU_samplesCount >= FALL_MAX_SAMPLES) return;
  IMU_samplesAx[IMU_samplesCount] = ax;
  IMU_samplesAy[IMU_samplesCount] = ay;
  IMU_samplesAz[IMU_samplesCount] = az;
  IMU_samplesTms[IMU_samplesCount] = (int16_t)(IMU_postCaptured * IMU_SAMPLE_MS);
  IMU_samplesCount++;
  IMU_postCaptured++;
  if (IMU_postCaptured >= FALL_POST_SAMPLES) {
    IMU_capturingPost = false;
    IMU_samplesReady = true;
  }
}

static String IMU_buildSamplesJson() {
  String payload;
  payload.reserve(12000);
  payload += "{\"eventUid\":\"";
  payload += IMU_eventUid;
  payload += "\",\"deviceId\":\"";
  payload += deviceId;
  payload += "\",\"samples\":[";
  for (uint16_t i = 0; i < IMU_samplesCount; i++) {
    if (i > 0) payload += ",";
    payload += "{\"seq\":";
    payload += i;
    payload += ",\"tMs\":";
    payload += IMU_samplesTms[i];
    payload += ",\"accX\":";
    payload += IMU_samplesAx[i];
    payload += ",\"accY\":";
    payload += IMU_samplesAy[i];
    payload += ",\"accZ\":";
    payload += IMU_samplesAz[i];
    payload += "}";
  }
  payload += "],\"units\":\"g\"}";
  return payload;
}

static uint32_t IMU_backoffMs(uint8_t attempts) {
  if (attempts == 0) return 0;
  if (attempts == 1) return 1000;
  if (attempts == 2) return 3000;
  if (attempts == 3) return 10000;
  return 60000;
}

static bool IMU_sendFallHeader() {
  if (WiFi.status() != WL_CONNECTED) return false;
  String url = String(BASE_URL) + FALL_HEADER_ENDPOINT;
  WiFiClient client;
  HTTPClient http;
  wdtPause();
  if (!http.begin(client, url)) {
    wdtResume();
    IMU_logEvent("header_begin_failed");
    return false;
  }
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");

  char payload[256];
  if (IMU_eventTs == "null" || IMU_eventTs.length() == 0) {
    snprintf(
      payload,
      sizeof(payload),
      "{\"eventUid\":\"%s\",\"deviceId\":\"%s\",\"eventType\":\"FALL\",\"occurredAt\":null}",
      IMU_eventUid.c_str(),
      deviceId.c_str()
    );
  } else {
    snprintf(
      payload,
      sizeof(payload),
      "{\"eventUid\":\"%s\",\"deviceId\":\"%s\",\"eventType\":\"FALL\",\"occurredAt\":\"%s\"}",
      IMU_eventUid.c_str(),
      deviceId.c_str(),
      IMU_eventTs.c_str()
    );
  }

  int code = http.POST((uint8_t*)payload, strlen(payload));
  http.getString();
  IMU_logEventI32("header_response", "code", code);
  http.end();
  wdtResume();
  return (code >= 200 && code < 300);
}

static bool IMU_sendFallSamples(const String& samplesJson) {
  if (WiFi.status() != WL_CONNECTED) return false;
  String url = String(BASE_URL) + FALL_SAMPLES_ENDPOINT;
  WiFiClient client;
  HTTPClient http;
  wdtPause();
  if (!http.begin(client, url)) {
    wdtResume();
    IMU_logEvent("samples_begin_failed");
    return false;
  }
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST((uint8_t*)samplesJson.c_str(), samplesJson.length());
  http.getString();
  IMU_logEventI32("samples_response", "code", code);
  http.end();
  wdtResume();
  return (code >= 200 && code < 300);
}

static void IMU_init(uint32_t now) {
  if (IMU_USE_WIRE_BEGIN) {
    Wire.begin(IMU_SDA, IMU_SCL);
  }
  uint8_t who = 0;
<<<<<<< Updated upstream
  if (IMU_readReg(IMU_REG_WHO_AM_I, who)) {
    (void)who;
  } else {
=======
  IMU_present = IMU_readReg(IMU_REG_WHO_AM_I, who) && who == 0x68;
  IMU_disabledByReadErrors = false;
  IMU_readFailStreak = 0;
  if (IMU_present) {
    IMU_writeReg(IMU_REG_PWR_MGMT_1, 0x00);
    IMU_writeReg(IMU_REG_ACCEL_CONFIG, IMU_ACCEL_CFG);
    IMU_writeReg(IMU_REG_GYRO_CONFIG, IMU_GYRO_CFG);
    IMU_writeReg(IMU_REG_CONFIG, IMU_DLPF_CFG);
  } else {
    Serial.println("[IMU] no detectado, se omiten lecturas IMU");
>>>>>>> Stashed changes
  }
  IMU_writeReg(IMU_REG_PWR_MGMT_1, 0x00);
  IMU_writeReg(IMU_REG_ACCEL_CONFIG, IMU_ACCEL_CFG);
  IMU_writeReg(IMU_REG_GYRO_CONFIG, IMU_GYRO_CFG);
  IMU_writeReg(IMU_REG_CONFIG, IMU_DLPF_CFG);

  imuPrefs.begin(IMU_NVS_NS, false);
  IMU_loadPendingFromNvs();
  if (IMU_pendingHeader && IMU_eventUid.length() > 0) {
    IMU_headerAttempts = 0;
    IMU_nextHeaderAttemptMs = now;
  }
}

static void IMU_confirmFall(uint32_t now) {
  IMU_eventUid = uuid_v4();
  IMU_eventTs = utcIsoNow();
  IMU_pendingHeader = true;
  IMU_pendingSamples = true;
  IMU_samplesReady = false;
  IMU_headerAttempts = 0;
  IMU_samplesAttempts = 0;
  IMU_nextHeaderAttemptMs = now;
  IMU_nextSamplesAttemptMs = 0;
  IMU_savePendingToNvs();

  IMU_buildSamplesFromPre();
  if (FALL_SIMULATION_MODE) {
    // Prototipo: enviar solo pre-samples para no depender de stillness/post.
    IMU_samplesReady = true;
    IMU_capturingPost = false;
    IMU_postCaptured = 0;
  } else {
    IMU_capturingPost = true;
    IMU_postCaptured = 0;
  }

}

static void IMU_processSendQueue(uint32_t now) {
  if (IMU_pendingHeader && IMU_eventUid.length() > 0) {
    if (now >= IMU_nextHeaderAttemptMs) {
      IMU_logEventU32("header_attempt", "attempt", IMU_headerAttempts + 1);
      bool ok = IMU_sendFallHeader();
      if (ok) {
        IMU_pendingHeader = false;
        IMU_savePendingToNvs();
      } else {
        IMU_headerAttempts++;
        IMU_nextHeaderAttemptMs = now + IMU_backoffMs(IMU_headerAttempts);
      }
    }
  }

  if (!IMU_pendingHeader && IMU_pendingSamples && IMU_samplesReady) {
    if (now >= IMU_nextSamplesAttemptMs) {
      IMU_logEventU32("samples_attempt", "attempt", IMU_samplesAttempts + 1);
      String json = IMU_buildSamplesJson();
      bool ok = IMU_sendFallSamples(json);
      if (ok) {
        IMU_pendingSamples = false;
      } else {
        IMU_samplesAttempts++;
        IMU_nextSamplesAttemptMs = now + IMU_backoffMs(IMU_samplesAttempts);
      }
    }
  }
}

static void IMU_loop(uint32_t now) {
<<<<<<< Updated upstream
=======
  if (!IMU_present || IMU_disabledByReadErrors) {
    IMU_processSendQueue(now);
    return;
  }
>>>>>>> Stashed changes
  if (now - IMU_lastSampleMs < IMU_SAMPLE_MS) {
    IMU_processSendQueue(now);
    return;
  }
  IMU_lastSampleMs = now;

  float ax, ay, az;
  if (!IMU_readAccelGyro(ax, ay, az)) {
    if (IMU_readFailStreak < 255) IMU_readFailStreak++;
    if (IMU_DISABLE_ON_I2C_ERRORS && IMU_readFailStreak >= IMU_MAX_CONSECUTIVE_READ_FAILS) {
      IMU_disabledByReadErrors = true;
      IMU_present = false;
      Serial.printf(
        "[IMU] desactivado tras %u fallos I2C consecutivos\n",
        (unsigned int)IMU_readFailStreak
      );
    }
    IMU_processSendQueue(now);
    return;
  }
  IMU_readFailStreak = 0;

  IMU_bufferPre(ax, ay, az);
  float mag = sqrtf(ax * ax + ay * ay + az * az);
  float magRaw = mag;
  IMU_magFilt = IMU_magFilt + IMU_LPF_ALPHA * (magRaw - IMU_magFilt);
  IMU_logDebug(ax, ay, az, magRaw, IMU_magFilt, now);
  if (magRaw > FALL_LIFT_G_MIN) {
    IMU_lastLiftMs = now;
  }

  if (IMU_capturingPost) {
    IMU_appendPostSample(ax, ay, az);
  }

  switch (IMU_state) {
    case IMU_IDLE:
      if (IMU_lastLiftMs != 0 && (now - IMU_lastLiftMs) < FALL_LIFT_BLOCK_MS) {
        if (IMU_DEBUG && (now - IMU_lastLiftLogMs) > 1000) {
          IMU_lastLiftLogMs = now;
          Serial.printf(
            "{\"type\":\"imu\",\"event\":\"lift_block\",\"dtMs\":%lu}\n",
            (unsigned long)(now - IMU_lastLiftMs)
          );
        }
        break;
      }
      if (magRaw < FALL_FREEFALL_G_MAX) {
        IMU_impactFromIdle = false;
        IMU_softFreefall = false;
        IMU_resetState(IMU_FREEFALL, now);
      } else if (magRaw < FALL_SOFT_FREEFALL_G_MAX) {
        IMU_impactFromIdle = false;
        IMU_softFreefall = true;
        IMU_resetState(IMU_FREEFALL, now);
      } else if (FALL_IMPACT_ONLY_ENABLE && magRaw >= FALL_IMPACT_ONLY_G_MIN) {
        IMU_impactFromIdle = true;
        if (FALL_SIMULATION_MODE) {
          IMU_resetState(IMU_CONFIRMED, now);
        } else {
          IMU_resetState(IMU_IMPACT, now);
        }
      }
      break;
    case IMU_FREEFALL: {
      uint32_t ffMs = now - IMU_stateSinceMs;
      IMU_logFreefall(magRaw, ffMs, now);
      float ffMaxG = IMU_softFreefall ? FALL_SOFT_FREEFALL_G_MAX : FALL_FREEFALL_G_MAX;
      uint32_t ffMinMs = IMU_softFreefall ? FALL_SOFT_FREEFALL_MIN_MS : FALL_FREEFALL_MIN_MS;
      if (magRaw < ffMaxG) {
        // seguimos en free-fall
        if (ffMs > FALL_FREEFALL_MAX_MS) {
          IMU_resetState(IMU_IDLE, now);
        }
      } else {
        if (ffMs >= ffMinMs) {
          // salio de free-fall: abrir ventana de impacto
          if (IMU_DEBUG) {
            Serial.printf(
              "{\"type\":\"imu\",\"event\":\"exit_freefall\",\"mag\":%.2f,\"ffMs\":%lu}\n",
              magRaw,
              (unsigned long)ffMs
            );
          }
          IMU_impactFromIdle = false;
          if (IMU_softFreefall) {
            IMU_softImpact = true;
          }
          IMU_resetState(IMU_IMPACT, now);
        } else {
          // free-fall demasiado corto
          IMU_resetState(IMU_IDLE, now);
        }
      }
      break;
    }
    case IMU_IMPACT: {
      uint32_t winMs = now - IMU_stateSinceMs;
      if (magRaw >= FALL_IMPACT_G_MIN) {
        IMU_softImpact = IMU_softFreefall ? true : false;
        if (FALL_SIMULATION_MODE) {
          IMU_resetState(IMU_CONFIRMED, now);
        } else {
          IMU_postMagMin = 10.0f;
          IMU_postMagMax = 0.0f;
          IMU_resetState(IMU_POST_IMPACT, now);
        }
      } else if (magRaw >= FALL_SOFT_IMPACT_G_MIN) {
        IMU_softImpact = true;
        if (IMU_DEBUG) {
          Serial.printf("{\"type\":\"imu\",\"event\":\"soft_impact\",\"mag\":%.2f}\n", magRaw);
        }
        IMU_postMagMin = 10.0f;
        IMU_postMagMax = 0.0f;
        IMU_resetState(IMU_POST_IMPACT, now);
      } else if (winMs > FALL_IMPACT_MAX_MS_AFTER_FREEFALL) {
        IMU_impactFromIdle = false;
        IMU_resetState(IMU_IDLE, now);
      }
      break;
    }
    case IMU_POST_IMPACT: {
      uint32_t postMs = now - IMU_stateSinceMs;
      uint32_t settleMs = IMU_softImpact ? FALL_SOFT_POST_SETTLE_MS : FALL_POST_SETTLE_MS;
      if (!IMU_postSettled) {
        if (postMs >= settleMs) {
          IMU_postMagMin = IMU_magFilt;
          IMU_postMagMax = IMU_magFilt;
          IMU_postSettled = true;
          if (IMU_DEBUG) {
            Serial.printf(
              "{\"type\":\"imu\",\"event\":\"post_settle\",\"ms\":%lu,\"mag\":%.2f}\n",
              (unsigned long)postMs,
              IMU_magFilt
            );
          }
        } else {
          break;
        }
      }
      if (IMU_magFilt < IMU_postMagMin) IMU_postMagMin = IMU_magFilt;
      if (IMU_magFilt > IMU_postMagMax) IMU_postMagMax = IMU_magFilt;
      uint32_t stillMinMs = IMU_softImpact ? FALL_SOFT_STILL_MIN_MS : FALL_POST_STILL_MIN_MS;
      float stillDeltaMax = IMU_softImpact ? FALL_SOFT_STILL_DELTA_MAX : FALL_STILL_DELTA_MAX;
      if (postMs >= stillMinMs) {
        if ((IMU_postMagMax - IMU_postMagMin) <= stillDeltaMax) {
          IMU_resetState(IMU_CONFIRMED, now);
        }
      }
      if (postMs >= FALL_POST_STILL_MAX_MS) {
        IMU_resetState(IMU_IDLE, now);
      }
      break;
    }
    case IMU_CONFIRMED:
      IMU_confirmFall(now);
      IMU_resetState(IMU_COOLDOWN, now);
      break;
    case IMU_COOLDOWN:
      if (now - IMU_stateSinceMs >= FALL_COOLDOWN_MS) {
        IMU_resetState(IMU_IDLE, now);
      }
      break;
  }

  IMU_processSendQueue(now);
}
// === IMU FALL END ===

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
// Tiempo local España (NTP)
// =====================
static const char* NTP1 = "pool.ntp.org";
static const char* NTP2 = "time.google.com";

static void setupTime() {
  configTime(0, 0, NTP1, NTP2);
  setenv("TZ", "CET-1CEST,M3.5.0/2,M10.5.0/3", 1);
  tzset();
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
  localtime_r(&now, &t);
  char buf[32];
  char tzbuf[6];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S", &t);
  strftime(tzbuf, sizeof(tzbuf), "%z", &t);
  if (strlen(tzbuf) == 5) {
    char out[40];
    snprintf(
      out,
      sizeof(out),
      "%s%c%c%c:%c%c",
      buf,
      tzbuf[0],
      tzbuf[1],
      tzbuf[2],
      tzbuf[3],
      tzbuf[4]
    );
    return String(out);
  }
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

// === TILT SENSOR BEGIN ===
static bool TILT_readRaw() {
  int v = digitalRead(TILT_PIN);
  return TILT_ACTIVE_LOW ? (v == LOW) : (v == HIGH);
}

static void TILT_init() {
  if (TILT_USE_PULLUP) {
    pinMode(TILT_PIN, INPUT_PULLUP);
  } else {
    pinMode(TILT_PIN, INPUT);
  }
  bool raw = TILT_readRaw();
  TILT_lastReading = raw;
  TILT_stableReading = raw;
  TILT_reportedState = raw;
  TILT_hasTilted = false;
  TILT_lastChangeMs = millis();
  TILT_holdStartMs = millis();
  TILT_lastEventMs = 0;
}

static void TILT_sendEvent(bool tilted) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[TILT] WiFi not connected");
    return;
  }

  String url = String(BASE_URL) + TILT_ENDPOINT;
  WiFiClient client;
  HTTPClient http;

  wdtPause();
  if (!http.begin(client, url)) {
    wdtResume();
    Serial.println("[TILT] http.begin failed");
    return;
  }
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");

  String eventUid = uuid_v4();
  String ts = utcIsoNow();
  char payload[256];
  if (ts == "null") {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"eventUid\":\"%s\",\"eventType\":\"%s\",\"occurredAt\":null}",
      deviceId.c_str(),
      eventUid.c_str(),
      TILT_EVENT_TYPE
    );
  } else {
    snprintf(
      payload,
      sizeof(payload),
      "{\"deviceId\":\"%s\",\"eventUid\":\"%s\",\"eventType\":\"%s\",\"occurredAt\":\"%s\"}",
      deviceId.c_str(),
      eventUid.c_str(),
      TILT_EVENT_TYPE,
      ts.c_str()
    );
  }

  int code = http.POST((uint8_t*)payload, strlen(payload));
  String body = http.getString();
  Serial.printf("[TILT] code=%d uid=%s\n", code, eventUid.c_str());
  Serial.printf("[TILT] body=%s\n", body.c_str());

  http.end();
  wdtResume();
}

static void TILT_process(uint32_t now) {
  bool raw = TILT_readRaw();
  if (raw != TILT_lastReading) {
    TILT_lastReading = raw;
    TILT_lastChangeMs = now;
  }

  if (now - TILT_lastChangeMs < TILT_DEBOUNCE_MS) {
    return;
  }

  if (TILT_stableReading != TILT_lastReading) {
    TILT_stableReading = TILT_lastReading;
    TILT_holdStartMs = now;
  }

  if (TILT_stableReading != TILT_reportedState) {
    if (now - TILT_holdStartMs >= TILT_HOLD_MS) {
      if (TILT_COOLDOWN_MS == 0 || (now - TILT_lastEventMs >= TILT_COOLDOWN_MS)) {
        TILT_reportedState = TILT_stableReading;
        if (TILT_reportedState) {
          TILT_lastEventMs = now;
          TILT_hasTilted = true;
          TILT_sendEvent(true);
        } else {
          Serial.println("[TILT] normal (ignorado)");
        }
      }
    }
  }
}
// === TILT SENSOR END ===

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

  // === TILT SENSOR BEGIN ===
  TILT_init();
  // === TILT SENSOR END ===

  // === IMU FALL SETUP HOOK ===
  IMU_init(millis());

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

  // === TILT SENSOR BEGIN ===
  TILT_process(now);
  // === TILT SENSOR END ===

  // === IMU FALL LOOP HOOK ===
  IMU_loop(now);

  updateLed(now);
  delay(5);
}
