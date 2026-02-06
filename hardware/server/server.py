from datetime import datetime, timezone
from typing import Optional, List, Literal, Set

from fastapi import FastAPI, Request
from pydantic import BaseModel, Field

app = FastAPI(title="ESP32 Backend", version="1.0.0")

SEEN_EVENTS: Set[str] = set()
SEEN_SAMPLES: Set[str] = set()

class Heartbeat(BaseModel):
    deviceId: str = Field(..., min_length=1)
    timestamp: Optional[str] = None  # tu ESP32 manda null -> aquí entra como None
    battery: Optional[float] = None
    rssi: int
    fwVersion: str


class EventSample(BaseModel):
    seq: int = Field(..., ge=0)
    tMs: int
    accX: float
    accY: float
    accZ: float


class EventIngest(BaseModel):
    deviceId: str = Field(..., min_length=1)
    eventUid: str = Field(..., min_length=1)
    eventType: Literal["FALL", "EMERGENCY_BUTTON", "SIMULATED", "TILT"]
    occurredAt: Optional[str] = None
    samples: Optional[List[EventSample]] = None


class EventSamplesPayload(BaseModel):
    deviceId: str = Field(..., min_length=1)
    eventUid: str = Field(..., min_length=1)
    samples: List[EventSample]
    units: Optional[str] = None


class TiltPayload(BaseModel):
    deviceId: str = Field(..., min_length=1)
    timestamp: Optional[str] = None
    tilted: bool


@app.get("/health")
def health():
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}


@app.post("/api/v1/devices/heartbeat")
async def heartbeat(payload: Heartbeat, request: Request):
    client_ip = request.client.host if request.client else "unknown"

    # Si no viene timestamp, ponemos uno del servidor
    server_ts = datetime.now(timezone.utc).isoformat()

    battery_str = f"{payload.battery:.2f}" if payload.battery is not None else "null"
    print(
        f"[HB] from={client_ip} deviceId={payload.deviceId} "
        f"battery={battery_str} rssi={payload.rssi} fw={payload.fwVersion} "
        f"ts={payload.timestamp or 'null'} server_ts={server_ts}"
    )

    return {
        "ok": True,
        "received": payload.model_dump(),
        "serverTimestamp": server_ts,
    }


@app.post("/api/v1/events/ingest")
async def ingest_event(payload: EventIngest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    server_ts = datetime.now(timezone.utc).isoformat()

    duplicated = payload.eventUid in SEEN_EVENTS
    if not duplicated:
        SEEN_EVENTS.add(payload.eventUid)

    sample_count = len(payload.samples) if payload.samples else 0
    print(
        f"[EV] from={client_ip} deviceId={payload.deviceId} "
        f"eventUid={payload.eventUid} type={payload.eventType} "
        f"samples={sample_count} ts={payload.occurredAt or 'null'} "
        f"server_ts={server_ts} duplicated={duplicated}"
    )

    return {
        "ok": True,
        "eventId": f"local-{payload.eventUid}",
        "duplicated": duplicated,
        "received": payload.model_dump(),
        "serverTimestamp": server_ts,
    }


@app.post("/api/v1/events/samples")
async def ingest_samples(payload: EventSamplesPayload, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    server_ts = datetime.now(timezone.utc).isoformat()

    new_count = 0
    dup_count = 0
    for s in payload.samples:
        key = f"{payload.eventUid}:{s.seq}"
        if key in SEEN_SAMPLES:
            dup_count += 1
        else:
            SEEN_SAMPLES.add(key)
            new_count += 1

    print(
        f"[SAMPLES] from={client_ip} deviceId={payload.deviceId} "
        f"eventUid={payload.eventUid} samples={len(payload.samples)} "
        f"new={new_count} dup={dup_count} units={payload.units or 'null'} "
        f"server_ts={server_ts}"
    )

    return {
        "ok": True,
        "eventId": f"local-{payload.eventUid}",
        "received": payload.model_dump(),
        "new": new_count,
        "duplicated": dup_count,
        "serverTimestamp": server_ts,
    }


@app.post("/api/v1/devices/tilt")
async def tilt_event(payload: TiltPayload, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    server_ts = datetime.now(timezone.utc).isoformat()

    print(
        f"[TILT] from={client_ip} deviceId={payload.deviceId} "
        f"tilted={payload.tilted} ts={payload.timestamp or 'null'} "
        f"server_ts={server_ts}"
    )

    return {
        "ok": True,
        "received": payload.model_dump(),
        "serverTimestamp": server_ts,
    }
