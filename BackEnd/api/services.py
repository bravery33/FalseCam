import asyncio
import base64
import logging
import os
import re
from io import BytesIO
from random import choice
from typing import Optional
from pydantic import BaseModel
import time
from uuid import uuid4

import fal_client
import openai
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Form, File, UploadFile, Header
from fastapi.responses import JSONResponse, StreamingResponse

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    force=True
)

router = APIRouter()
BFL_API_KEY = os.getenv("BFL_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
BFL_ENDPOINT = "fal-ai/flux-pro/kontext"
VIDEO_MODEL_NAME = "kling-video/v2.1/standard/image-to-video"

STYLE_PROMPT = {
    "realistic": "semi_realistic, hyper-detailed, sharp focus, DSLR photo, documentary style, 100mm lens, soft natural lighting, perfect skin, editorial photo, 4k, k-fasion, designer clothes, stylisth",
    "2d": "anime, flat design aesthetic, vibrant colors, expressive eyes, clean line art, cel shading,k-fasion",
    "3d": "pixar-like animation style, smooth surfaces, cinematic lighting, subsurface scattering, warm and inviting lighting, cute 3D character, dreamy, k-fasion, designer clothes, stylisth",
    "cyberpunk": "cyberpunk, neon-soaked cityscape, dramatic backlighting, holographic elements, reflective surfaces, futuristic sci-fi fantasy",
    "dot": "8-bit pixel art character, full body, standing, retro video game sprite, visible pixels, blocky edges, choppy lines, limited color palette, pixel grid, low resolution, pixel art background, game screenshot, k-fasion, designer clothes, stylisth"
}

GENDER_KO_TO_EN = {
    "male": "male",
    "female": "female",
    "other": "gender-neutral"
}

AGE_MAP = {
    "9": "5-year-old",
    "10": "15-year-old",
    "20": "25-year-old",
    "30": "35-year-old",
    "40": "45-year-old",
    "50": "55-year-old",
    "60": "75-year-old"
}

def contains_korean(text: str) -> bool:
    return bool(re.search("[가-힣]", text))

async def get_translated_text(text: str) -> str:
    if not OPENAI_API_KEY or not contains_korean(text):
        return text

    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI artist. Given the user's input, imagine the scene and translate it into a vivid "
                "English prompt. The prompt must always include, in detail, a specific camera angle and composition "
                "(e.g., low-angle, side view, from behind), the background, environment, what the person is doing, "
                "surrounding objects, the mood, and the time, based on the user's input. Never, under any circumstances, "
                "describe the person's face or physical appearance. Write as if you are describing what you saw firsthand, "
                "vividly, and strictly from a third-person point of view."
            ),
        },
        {"role": "user", "content": text},
    ]

    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.5,
            max_tokens=100,
            request_timeout=15,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"❌ 상황 프롬프트 생성 실패: {str(e)}")
        return text

USER_MEDIA_DIR = "user_media"

@router.post("/generate/image")
async def generate_image(
    text: str = Form(...),
    style: str = Form(""),
    age: str = Form(""),
    gender: str = Form(""),
    sessionID: str = Header(...),
    image: Optional[UploadFile] = File(None),
) -> JSONResponse:

    if not BFL_API_KEY:
        return JSONResponse(status_code=500, content={"success": False, "error": "API key missing."})

    translated_prompt = await get_translated_text(text)
    style_prompt = STYLE_PROMPT.get(style, choice(list(STYLE_PROMPT.values())))
    gender_en = GENDER_KO_TO_EN.get(gender, choice(list(GENDER_KO_TO_EN.values())))
    final_age = AGE_MAP.get(age, choice(list(AGE_MAP.values())))
    ethnicity_keyword = "Korean" if contains_korean(text) else ""
    paparazzi_prompt = "not looking at the camera, full-body shot, candid, like a paparazzi photo, natural moment"

    if style == "dot" and not image:
        subject_prompt = f"A {final_age} {ethnicity_keyword} {gender_en}"
        final_prompt_parts = [translated_prompt, style_prompt, subject_prompt]
    elif image:
        subject_prompt = f"photo of a {final_age} {ethnicity_keyword} {gender_en}"
        face_guidance_prompt = "The face in the generated image must be a very close and exact match to the reference photo."
        final_prompt_parts = [face_guidance_prompt, translated_prompt, style_prompt, subject_prompt, paparazzi_prompt]
    else:
        subject_prompt = f"A {final_age} {ethnicity_keyword} {gender_en}"
        final_prompt_parts = [translated_prompt, style_prompt, subject_prompt, paparazzi_prompt]

    composed_prompt = ". ".join(filter(None, final_prompt_parts))

    payload = {
        "prompt": composed_prompt,
        "guidance_scale": 8 if style == "dot" else 3,
        "num_images": 1,
        "output_format": "png",
        "aspect_ratio": "3:4",
        "negative_prompt": (
            "distorted face, blurry, ugly, side view, back view, "
            "turned away, face covered, shadow on face"
        )
    }

    if image:
        image_bytes = await image.read()
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        payload["image_url"] = f"data:image/png;base64,{encoded_image}"
        payload["image_guidance_scale"] = 0.1

    try:
        logging.info("✨ 이미지 생성 시작")
        img_result = await asyncio.to_thread(fal_client.run, BFL_ENDPOINT, arguments=payload)
        final_image_url = img_result["images"][0]["url"]

        # ✅ 항상 이미지 URL을 받아 저장
        image_response = requests.get(final_image_url, timeout=15)
        image_response.raise_for_status()

        user_folder = os.path.join(USER_MEDIA_DIR, sessionID)
        os.makedirs(user_folder, exist_ok=True)

        filename = f"{uuid4().hex}.png"
        save_path = os.path.join(user_folder, filename)
        with open(save_path, "wb") as f:
            f.write(image_response.content)

        final_user_url = f"/media/{sessionID}/{filename}"
        logging.info(f"✅ 이미지 생성 및 저장 성공: {save_path}")
        return JSONResponse(content={"success": True, "image": final_user_url})

    except Exception as e:
        logging.exception("❌ 이미지 생성 실패")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class VideoRequest(BaseModel):
    image_url: str

@router.post("/generate/video")
async def generate_video_from_image(req: VideoRequest):
    FIXED_VIDEO_PROMPT = "A 5-second video with a slow camera pan around the subject, cinematic, smooth movement."
    TIMEOUT_SECONDS = 30
    POLL_INTERVAL = 2

    try:
        logging.info(f"🎞️ URL 기반 영상 생성 요청 시작 (URL: {req.image_url})")

        result = await asyncio.to_thread(
            fal_client.run,
            f"fal-ai/{VIDEO_MODEL_NAME}",
            arguments={
                "prompt": FIXED_VIDEO_PROMPT,
                "image_url": req.image_url,
                "duration": 5
            }
        )

        request_id = result.get("request_id")
        if not request_id:
            logging.error(f"❌ Fal 응답에 request_id 없음: {result}")
            return JSONResponse(status_code=500, content={"success": False, "error": "Fal 응답에 request_id 없음"})

        attempt = 0
        start_time = time.monotonic()
        while time.monotonic() - start_time < TIMEOUT_SECONDS:
            attempt += 1
            status = await asyncio.to_thread(fal_client.get_request, request_id)

            if not status:
                logging.warning(f"⚠️ Fal 상태 응답이 비어있음 (시도: #{attempt})")
                await asyncio.sleep(POLL_INTERVAL)
                continue

            state = status.get("status")
            logging.debug(f"🔁 영상 상태 체크 #{attempt}: {state}")

            if state == "succeeded":
                video_url = status.get("video", {}).get("url")
                if video_url:
                    logging.info(f"✅ 영상 생성 완료 (url: {video_url})")
                    return JSONResponse(content={"success": True, "video_url": video_url})
                else:
                    logging.error(f"❌ 응답에 video_url 없음: {status}")
                    return JSONResponse(status_code=500, content={"success": False, "error": "Video URL not found in response."})

            elif state == "failed":
                logging.error(f"❌ Fal 응답: 영상 생성 실패: {status}")
                return JSONResponse(status_code=500, content={"success": False, "error": "Video generation failed."})

            await asyncio.sleep(POLL_INTERVAL)

        logging.error(f"⏰ 영상 생성 요청 타임아웃 (Request ID: {request_id})")
        return JSONResponse(status_code=504, content={"success": False, "error": "Video generation timed out."})

    except Exception as e:
        logging.exception(f"❌ 영상 생성 중 예기치 않은 예외 발생: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": "An unexpected error occurred during video generation."})
