import asyncio
import base64
import logging
import os
from io import BytesIO
from random import choice
from typing import Optional

import openai
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Form, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse

load_dotenv()


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

router = APIRouter()
BFL_API_KEY = os.getenv("BFL_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
BFL_ENDPOINT = "https://api.bfl.ai/v1/flux-kontext-pro"


STYLE_KO_TO_EN = {
    "실사": "ultra-realistic portrait with soft lighting, smooth skin texture, cinematic depth of field, beautified",
    "2D 애니메이션": "studio-quality 2D anime style, cel shading, high contrast, expressive eyes, vibrant colors",
    "3D 애니메이션": "high-end 3D rendering in Pixar style, soft shadows, glossy materials, warm lighting",
    "사이버펑크": "cyberpunk style with neon lights, dark cityscape background, glowing elements, reflective surfaces, futuristic atmosphere",
    "도트그래픽": "8-bit pixel art style, retro game aesthetic, limited color palette, low resolution, nostalgic mood"
}

GENDER_KO_TO_EN = {
    "남성": "male",
    "여성": "female",
    "기타": "neutral"
}

AGE_CHOICES = ["5", "15", "25", "35", "45", "55", "75"]


@router.post("/translate")
async def translate_text(text: str = Form(...)) -> JSONResponse:
    if not OPENAI_API_KEY:
        logging.error("❌ OPENAI_API_KEY가 설정되지 않았습니다❌")
        return JSONResponse(status_code=500, content={"success": False, "error": "API key missing."})

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Translate the following Korean text to English."},
                {"role": "user", "content": text}
            ],
            temperature=0.3,
            max_tokens=100
        )
        translated = response.choices[0].message.content.strip()
        logging.info(f"✅ 번역 결과: {translated}")
        return JSONResponse(content={"success": True, "translated": translated})

    except Exception as e:
        logging.error(f"❌ 번역 실패: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@router.post("/generate/image")
async def generate_image(
    text: str = Form(...),
    style: str = Form(""),
    age: str = Form(""),
    gender: str = Form(""),
    image: Optional[UploadFile] = None
) -> JSONResponse:
    if not BFL_API_KEY or not OPENAI_API_KEY:
        logging.error("❌ API Key가 설정되지 않았습니다❌")
        return JSONResponse(status_code=500, content={"success": False, "error": "API key missing."})
    
    if style and style in STYLE_KO_TO_EN:
        style = STYLE_KO_TO_EN[style]
    else:
        style = choice(list(STYLE_KO_TO_EN.values()))

    if gender and gender in GENDER_KO_TO_EN:
        gender = GENDER_KO_TO_EN[gender]
    else:
        gender = choice(list(GENDER_KO_TO_EN.values()))

    if not age:
        age = choice(AGE_CHOICES)

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Translate the following Korean text to English."},
                {"role": "user", "content": text}
            ],
            temperature=0.3,
            max_tokens=100
        )
        translated = response.choices[0].message.content.strip()
        logging.info(f"✅ 번역된 텍스트: {translated}")

        composed_prompt = (
            f"{translated}, portrayed as a {age}-year-old {gender}, "
            f"shot in candid paparazzi style with a 100mm lens, 720p, 3:4 aspect ratio, "
            f"in {style} style, seen from a third-person perspective with subtle embellishment."
            "Overall cute creation."
        )

        logging.info(f"🐾 최종 프롬프트 : {composed_prompt}")

        payload = {"prompt": composed_prompt, "aspect_ratio": "3:4"}

        if image:
            image_bytes = await image.read()
            encoded_image = base64.b64encode(image_bytes).decode("utf-8")
            payload["image"] = f"data:image/png;base64,{encoded_image}"
            logging.info("📸 이미지 업로드 및 base64 인코딩 완료")

        headers = {
            "accept": "application/json",
            "x-key": BFL_API_KEY,
            "Content-Type": "application/json"
        }

        response = requests.post(BFL_ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        polling_url = data.get("polling_url")
        request_id = data.get("id")

        if not polling_url or not request_id:
            logging.error("⚠️ BFL에서 polling_url 또는 request_id를 받지 못함.")
            return JSONResponse(status_code=500, content={"success": False, "error": "Invalid response from BFL."})

        logging.info("💫 이미지 생성 상태 확인을 위해 polling 시작")

        for _ in range(20):
            await asyncio.sleep(1)
            poll = requests.get(
                polling_url,
                headers={"accept": "application/json", "x-key": BFL_API_KEY},
                params={"id": request_id}
            )
            poll.raise_for_status()
            result = poll.json()

            if result.get("status") == "Ready":
                image_url = result["result"]["sample"]
                logging.info(f"✅ 이미지 생성 완료. URL : {image_url}")
                image_response = requests.get(image_url)
                image_response.raise_for_status()
                encoded_image = base64.b64encode(image_response.content).decode("utf-8")
                data_uri = f"data:image/png;base64,{encoded_image}"

                return JSONResponse(
                    content={"success": True, "image": data_uri}
                )

            elif result.get("status") in ["Error", "Failed"]:
                logging.error("❌ 이미지 생성 실패 또는 오류 발생")
                break

        logging.warning("⌛ 이미지 생성 polling 시간 초과")
        return JSONResponse(status_code=504, content={"success": False, "error": "Timeout."})

    except Exception as e:
        logging.error(f"❌ 처리 중 예외 발생: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

    
    


@router.get("/generated_image")
def proxy_image(url: str) -> StreamingResponse:
    try:
        logging.info(f"📥 이미지 프록시 요청 : {url}")
        response = requests.get(url)
        return StreamingResponse(BytesIO(response.content), media_type="image/jpeg")

    except Exception:
        logging.error("❌ 프록시 이미지 요청 실패")
        return JSONResponse(status_code=404, content={"success": False, "Error": "Image not found😲."})
