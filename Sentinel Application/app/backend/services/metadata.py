"""
Metadata extraction service
Extracts technical forensic metadata from media files
"""

import io, logging
from typing import Optional
from PIL import Image
import mutagen
from datetime import datetime

logger = logging.getLogger("sentinel.metadata")


async def extract_metadata(content: bytes, content_type: str) -> dict:
    """
    Extract technical metadata from uploaded media.
    Returns structured forensic metadata dict.
    """
    meta = {
        "file_size_bytes": len(content),
        "content_type": content_type,
        "extracted_at": datetime.utcnow().isoformat(),
    }

    try:
        if content_type.startswith("image/"):
            meta.update(_extract_image_meta(content))
        elif content_type.startswith("video/"):
            meta.update(_extract_video_meta(content))
        elif content_type.startswith("audio/"):
            meta.update(_extract_audio_meta(content))
    except Exception as e:
        logger.warning(f"Metadata extraction partial failure: {e}")
        meta["extraction_error"] = str(e)

    return meta


def _extract_image_meta(content: bytes) -> dict:
    img = Image.open(io.BytesIO(content))
    meta = {
        "width": img.width,
        "height": img.height,
        "mode": img.mode,
        "format": img.format,
        "has_transparency": img.mode in ("RGBA", "LA", "PA"),
    }

    # EXIF data (strip PII like GPS)
    exif = {}
    if hasattr(img, "_getexif") and img._getexif():
        raw_exif = img._getexif() or {}
        SAFE_EXIF_TAGS = {271: "make", 272: "model", 305: "software", 306: "datetime", 531: "ycbcr_positioning"}
        for tag_id, name in SAFE_EXIF_TAGS.items():
            if tag_id in raw_exif:
                exif[name] = str(raw_exif[tag_id])

    meta["exif"] = exif
    meta["exif_pii_stripped"] = True  # GPS and device serial removed
    return meta


def _extract_video_meta(content: bytes) -> dict:
    # In production: use ffprobe/ffmpeg via subprocess
    return {
        "format": "video",
        "note": "Full video metadata extraction requires ffprobe. Install ffmpeg.",
    }


def _extract_audio_meta(content: bytes) -> dict:
    try:
        audio = mutagen.File(io.BytesIO(content))
        if audio:
            return {
                "duration_seconds": getattr(audio.info, "length", None),
                "bitrate": getattr(audio.info, "bitrate", None),
                "sample_rate": getattr(audio.info, "sample_rate", None),
                "channels": getattr(audio.info, "channels", None),
                "format": type(audio).__name__,
            }
    except Exception as e:
        logger.warning(f"Audio metadata error: {e}")
    return {"format": "audio", "note": "Metadata extraction limited"}
