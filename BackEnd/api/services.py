import asyncio
import base64
import logging
import os
import re
from io import BytesIO
from random import choice
from typing import Optional

import fal_client as fal
import openai
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Form, File, UploadFile
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


@router.post("/generate/image")
async def generate_image(
    text: str = Form(...),
    style: str = Form(""),
    age: str = Form(""),
    gender: str = Form(""),
    image: Optional[UploadFile] = File(None),
) -> JSONResponse:

    if not BFL_API_KEY:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "API key missing."}
        )

    translated_prompt = await get_translated_text(text)
    style_prompt = (
        STYLE_PROMPT[style]
        if style and style in STYLE_PROMPT
        else choice(list(STYLE_PROMPT.values()))
    )
    gender_en = (
        GENDER_KO_TO_EN[gender]
        if gender and gender in GENDER_KO_TO_EN
        else choice(list(GENDER_KO_TO_EN.values()))
    )
    final_age = (
        AGE_MAP[age]
        if age and age in AGE_MAP
        else choice(list(AGE_MAP.values()))
    )
    ethnicity_keyword = "Korean" if contains_korean(text) else ""
    paparazzi_prompt = (
        "not looking at the camera, full-body shot, candid,"
        "like a paparazzi photo, natural moment"
    )

    if style == "dot" and not image:
        subject_prompt = f"A {final_age} {ethnicity_keyword} {gender_en}"
        style_prompt = STYLE_PROMPT["dot"]
        final_prompt_parts = [
            translated_prompt,
            style_prompt,
            subject_prompt,
        ]
        composed_prompt = ". ".join(filter(None, final_prompt_parts))
        payload = {
            "prompt": composed_prompt,
            "guidance_scale": 8,
            "num_images": 1,
            "output_format": "png",
            "aspect_ratio": "3:4",
            "negative_prompt": (
                "distorted face, blurry, ugly, side view, back view, "
                "turned away, face covered, shadow on face"
            ),
        }
    elif image:
        subject_prompt = f"photo of a {final_age} {ethnicity_keyword} {gender_en}"
        face_guidance_prompt = (
            "The face in the generated image must be a very close and exact match to the reference photo."
        )
        final_prompt_parts = [
            face_guidance_prompt,
            translated_prompt,
            style_prompt,
            subject_prompt,
            paparazzi_prompt,
        ]
        composed_prompt = ". ".join(filter(None, final_prompt_parts))
        image_bytes = await image.read()
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "prompt": composed_prompt,
            "guidance_scale": 4,
            "image_guidance_scale": 0.3,
            "num_images": 1,
            "output_format": "png",
            "aspect_ratio": "3:4",
            "image_url": f"data:image/png;base64,{encoded_image}",
            "negative_prompt": (
                "random face, distorted face, blurry, ugly, side view, back view, "
                "turned away, face covered, shadow on face"
            ),
        }
    else:
        subject_prompt = f"A {final_age} {ethnicity_keyword} {gender_en}"
        final_prompt_parts = [
            translated_prompt,
            style_prompt,
            subject_prompt,
            paparazzi_prompt,
        ]
        composed_prompt = ". ".join(filter(None, final_prompt_parts))
        payload = {
            "prompt": composed_prompt,
            "guidance_scale": 8,
            "num_images": 1,
            "output_format": "png",
            "aspect_ratio": "3:4",
            "negative_prompt": (
                "distorted face, blurry, ugly, side view, back view, "
                "turned away, face covered, shadow on face"
            ),
        }

    logging.info(f"🐾 최종 프롬프트: {composed_prompt}")

    try:
        img_result = await asyncio.to_thread(
            fal.run,
            BFL_ENDPOINT,
            arguments=payload
        )
        final_image_url = img_result["images"][0]["url"]
        image_response = requests.get(final_image_url, timeout=15)
        image_response.raise_for_status()
        encoded_image = base64.b64encode(image_response.content).decode("utf-8")
        output_format = payload.get("output_format", "png")
        data_uri = f"data:image/{output_format};base64,{encoded_image}"
        return JSONResponse(content={"success": True, "image": data_uri})
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
            media_type=response.headers["Content-Type"],
        )
    except Exception as e:
        logging.error(f"❌ 프록시 이미지 요청 실패: {e}")
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Image not found."}
        )
