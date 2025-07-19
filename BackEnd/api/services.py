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
from fastapi import APIRouter, File, Form, UploadFile, Header
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

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

FAL_IMAGE_MODEL_ENDPOINT = "fal-ai/flux-pro/kontext"
FAL_TEXT_TO_IMAGE_MODEL_ENDPOINT = "fal-ai/flux-kontext-lora/text-to-image"
FAL_VIDEO_MODEL_ENDPOINT = "fal-ai/kling-video/v2.1/standard/image-to-video" 


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
                "You are an AI artist. "
                "Your primary goal is to shatter the mundane reality of the user's input and "
                "radically reimagine it as a deeply symbolic, metaphorical, and visually arresting masterpiece. "
                "Given the user's input, imagine the scene and translate it into a vivid "
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
    session_id: str = Header(None, alias="sessionID")
) -> JSONResponse:
    if not BFL_API_KEY:
        return JSONResponse(status_code=500, content={"success": False, "error": "API key missing."})
    logging.info(f"🐾 세션 아이디: {session_id}")
    translated_prompt = await get_translated_text(text)
    style_prompt = STYLE_PROMPT.get(style, choice(list(STYLE_PROMPT.values())))
    gender_en = GENDER_KO_TO_EN.get(gender, choice(list(GENDER_KO_TO_EN.values())))
    final_age = AGE_MAP.get(age, choice(list(AGE_MAP.values())))
    
    if image:
        ethnicity_keyword = "Korean" if contains_korean(text) else ""
        paparazzi_prompt = "not looking at the camera, full-body shot, candid, like a paparazzi photo, natural moment"
        subject_prompt = f"photo of a {final_age} {ethnicity_keyword} {gender_en}"
        face_guidance_prompt = "The face in the generated image must be a very close and exact match to the reference photo."
        final_prompt_parts = [face_guidance_prompt, translated_prompt, style_prompt, subject_prompt, paparazzi_prompt]
        composed_prompt = ". ".join(filter(None, final_prompt_parts))
        image_bytes = await image.read()
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "prompt": composed_prompt, 
            "guidance_scale": 4, 
            "image_guidance_scale": 0.3, 
            "num_images": 1,
            "output_format": "png", 
            "image_size": "portrait_4_3", 
            "image_url": f"data:image/png;base64,{encoded_image}",
            "negative_prompt": "random face, distorted face, blurry, ugly, side view, back view, turned away, face covered, shadow on face",
        }
        
        logging.info(f"🐾 fal.ai 이미지 프롬프트: {composed_prompt}")
        try:
            img_result = await asyncio.to_thread(fal.run, FAL_IMAGE_MODEL_ENDPOINT, arguments=payload)
            final_image_url = img_result["images"][0]["url"]
        except Exception as e:
            logging.error(f"❌ fal.ai 이미지 처리 중 예외 발생: {e}")
            return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
            
    else:
        subject_prompt = f"A {final_age} {gender_en} person"
        final_prompt_parts = [translated_prompt, style_prompt, subject_prompt]
        composed_prompt = ". ".join(filter(None, final_prompt_parts))
        
        payload = {
            "prompt": composed_prompt,
            "num_images": 1,
            "output_format": "png",
            "image_size": "portrait_4_3",
            "negative_prompt": "random face, distorted face, blurry, ugly, side view, back view, turned away, face covered, shadow on face",
        }

        logging.info(f"🐾 fal.ai 텍스트-이미지 프롬프트: {composed_prompt}")
        try:
            img_result = await asyncio.to_thread(
                fal.run, FAL_TEXT_TO_IMAGE_MODEL_ENDPOINT, arguments=payload
            )
            final_image_url = img_result["images"][0]["url"]
        except Exception as e:
            logging.error(f"❌ fal.ai 텍스트-이미지 처리 중 예외 발생: {e}")
            return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

    try:
        image_response = requests.get(final_image_url, timeout=20)
        image_response.raise_for_status()
        encoded_image = base64.b64encode(image_response.content).decode("utf-8")
        data_uri = f"data:image/png;base64,{encoded_image}"
        return JSONResponse(content={"success": True, "image": data_uri})
    except Exception as e:
        logging.error(f"❌ 최종 이미지 처리 중 예외 발생: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class VideoRequest(BaseModel):
    prompt: str
    image_url: str
    style: str
    age: str
    gender: str

@router.post("/generate/video")
async def generate_video(
    request: VideoRequest,
    session_id: str = Header(None, alias="sessionID")
) -> JSONResponse:
    if not BFL_API_KEY:
        return JSONResponse(status_code=500, content={"success": False, "error": "API key missing."})
    logging.info(f"🚀 비디오 생성 요청 (세션: {session_id}): {request.prompt}")
    logging.info(f"🚀 비디오 생성 진행 (세션: {session_id})")
    payload = {
        "image_url": request.image_url,
        "prompt": request.prompt,
        "seed": 42
    }

    logging.info(f"🚀 비디오 생성 요청: {request.prompt}")
    try:
        video_result = await asyncio.to_thread(
            fal.run,
            FAL_VIDEO_MODEL_ENDPOINT,
            arguments=payload
        )
        final_video_url = video_result["video"]["url"]

        return JSONResponse(content={"success": True, "video_url": final_video_url})
    except Exception as e:
        logging.error(f"❌ 비디오 생성 중 예외 발생: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
    

@router.get("/generated_image_proxy")
def proxy_image(url: str) -> StreamingResponse:
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return StreamingResponse(BytesIO(response.content), media_type=response.headers["Content-Type"])
    except Exception as e:
        logging.error(f"❌ 프록시 이미지 요청 실패: {e}")
        return JSONResponse(status_code=404, content={"success": False, "error": "Image not found."})