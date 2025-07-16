import asyncio
import base64
import logging
import os
import re
from io import BytesIO
from random import choice
from typing import Optional

import openai
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Form, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse


load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


router = APIRouter()
BFL_API_KEY = os.getenv("BFL_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
BFL_ENDPOINT = "https://api.bfl.ai/v1/flux-kontext-pro"


STYLE_PROMPT = {
    "realistic": "hyper-detailed, sharp focus, DSLR photo, documentary style, 100mm lens, soft natural lighting",
    "2D": "vibrant colors, expressive eyes, clean line art, cel shading, anime screencap, flat design aesthetic",
    "3D": "pixar-like animation style, smooth surfaces, subsurface scattering, warm and inviting lighting, cute 3D character",
    "cyberpunk": "neon-soaked cityscape, dramatic backlighting, holographic elements, reflective surfaces, futuristic sci-fi fantasy",
    "dot": "8-bit pixel art character, full body, retro gaming style, low resolution"
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
        {"role": "system",
         "content": "Translate the following Korean text to natural English for an image generation prompt."},
        {"role": "user", "content": text}
    ]

    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.3,
            max_tokens=100,
            request_timeout=15
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"❌ 번역 실패: {str(e)}")
        return text


@router.post("/generate/image")
async def generate_image(
    text: str = Form(...),
    style: str = Form(""),
    age: str = Form(""),
    gender: str = Form(""),
    image: Optional[UploadFile] = None
) -> JSONResponse:

    if not BFL_API_KEY:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "API key missing."}
        )

    translated_prompt: str = await get_translated_text(text)
    style_prompt: str = STYLE_PROMPT.get(style) or choice(list(STYLE_PROMPT.values()))
    gender_en: str = GENDER_KO_TO_EN.get(gender) or choice(list(GENDER_KO_TO_EN.values()))
    final_age: str = AGE_MAP.get(age) or choice(list(AGE_MAP.values()))
    paparazzi_prompt: str = (
        "full-body shot, candid, not looking at the camera, "
        "like a paparazzi photo, natural moment"
    )
    ethnicity_keyword: str = "Korean" if contains_korean(text) else ""

    if style == "dot" and not image:
        subject_prompt = f"A {final_age} {ethnicity_keyword} {gender_en} {translated_prompt}"
        style_prompt = STYLE_PROMPT["dot"]
        final_prompt_parts = [
            style_prompt,
            subject_prompt
        ]
    elif image:
        subject_prompt = f"photo of a {final_age} {ethnicity_keyword} {gender_en}"
        face_guidance_prompt = (
            "The face in the generated image must be a very close and exact match to the reference photo."
        )
        final_prompt_parts = [
            style_prompt,
            subject_prompt,
            translated_prompt,
            face_guidance_prompt,
            paparazzi_prompt
        ]
    else:
        subject_prompt = f"A {final_age} {ethnicity_keyword} {gender_en}"
        final_prompt_parts = [
            style_prompt,
            translated_prompt,
            subject_prompt,
            paparazzi_prompt
        ]

    composed_prompt: str = ", ".join(filter(None, final_prompt_parts))
    logging.info(f"🐾 최종 프롬프트: {composed_prompt}")

    try:
        payload = {
            "prompt": composed_prompt,
            "guidance_scale": 4,
            "num_images": 1,
            "output_format": "png",
            "aspect_ratio": "3:4"
        }
        if image:
            image_bytes = await image.read()
            encoded_image = base64.b64encode(image_bytes).decode("utf-8")
            payload["image"] = f"data:image/png;base64,{encoded_image}"

        headers = {
            "accept": "application/json",
            "x-key": BFL_API_KEY,
            "Content-Type": "application/json"
        }

        response = requests.post(
            BFL_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=20
        )
        response.raise_for_status()
        data = response.json()
        polling_url = data.get("polling_url")
        request_id = data.get("id")

        if not polling_url or not request_id:
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Invalid response from BFL API."}
            )

        for _ in range(30):
            await asyncio.sleep(1.5)
            poll = requests.get(
                polling_url,
                headers={"accept": "application/json", "x-key": BFL_API_KEY},
                params={"id": request_id},
                timeout=10
            )
            poll.raise_for_status()
            result = poll.json()

            if result.get("status") == "Ready":
                image_url = result["result"]["sample"]
                image_response = requests.get(image_url, timeout=15)
                image_response.raise_for_status()
                encoded_image = base64.b64encode(image_response.content).decode("utf-8")
                
                output_format = payload.get("output_format", "png")
                data_uri = f"data:image/{output_format};base64,{encoded_image}"
                logging.info(f"API로 보낼 payload: {payload}")
                return JSONResponse(content={"success": True, "image": data_uri})
            elif result.get("status") in ["Error", "Failed"]:
                logging.error(f"❌ 이미지 생성 실패 또는 오류 발생: {result}")
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "error": "Image generation failed."}
                )

        logging.warning("⌛ 이미지 생성 polling 시간 초과")
        return JSONResponse(
            status_code=504,
            content={"success": False, "error": "Timeout."}
        )

    except requests.exceptions.HTTPError as e:
        logging.error(f"❌ BFL API HTTP 오류 발생: {e.response.text}")
        return JSONResponse(
            status_code=e.response.status_code,
            content={"success": False, "error": e.response.text}
        )
    except Exception as e:
        logging.error(f"❌ 처리 중 예외 발생: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


@router.get("/generated_image_proxy")
def proxy_image(url: str) -> StreamingResponse:
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return StreamingResponse(
            BytesIO(response.content),
            media_type=response.headers["Content-Type"]
        )
    except Exception as e:
        logging.error(f"❌ 프록시 이미지 요청 실패: {e}")
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Image not found."}
        )
