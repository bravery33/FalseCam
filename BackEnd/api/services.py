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


STYLE_PROMPTS = {
    "realistic": (
        "semi_realistic, hyper-detailed, sharp focus, DSLR photo, documentary style, "
        "100mm lens, soft natural lighting, editorial photo, 4k, k-fashion, "
        "stylish, fashion editorial style"
    ),
    "2d": (
        "Classic 2D anime screenshot, cel shaded animation, Studio Ghibli color palette, "
        "clean lineart, expressive eyes, dynamic composition, trending on pixiv"
    ),
    "3d": (
        "Pixar animation style, 3d animation, "
        "cinematic still from an animated film, stylized character, cartoony proportions, "
        "large expressive eyes, smooth shading, vibrant and warm lighting"
    ),
    "cyberpunk": (
        "cyberpunk aesthetic, Blade Runner style, neon-drenched cityscape, holographic ads, "
        "glowing cybernetic implants, futuristic fashion, cinematic, idealized proportions"
    ),
    "dot": (
        "True 16-bit pixel art, detailed game sprite, SNES retro style, "
        "strong pixel grid, dithering, limited color palette, idealized proportions, "
        "full body character"
    )
}

GENDER_MAP = {"male": "male", "female": "female", "other": "gender-neutral"}
AGE_MAP = {
    "9": "5-year-old", "10": "15-year-old", "20": "25-year-old", "30": "35-year-old",
    "40": "45-year-old", "50": "55-year-old", "60": "75-year-old"
}


def contains_korean(text: str) -> bool:
    return bool(re.search("[가-힣]", text))


async def get_translated_text(text: str) -> str:
    if not OPENAI_API_KEY or not contains_korean(text):
        return text

    system_prompt = (
        "You are an AI prompt creator. Based on the user's input, create a detailed and "
        "atmospheric English prompt for an image generation AI. Key requirements: "
        "1. Describe a scene with a clear background, action, and a positive, cheerful mood. "
        "2. This is the most important rule: The main character MUST be facing the camera or "
        "be in a three-quarter view. Absolutely no back views. "
        "3. Do not describe the character's face in any way. Focus only on the scene, "
        "setting, and action. "
        "4. Based on the scene and action, briefly suggest an appropriate and stylish "
        "outfit for the character. Example: for 'a walk in the park', suggest "
        "'wearing a casual hoodie and jeans'. For 'a beach vacation', suggest "
        "'wearing a light summer dress'."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": text},
    ]

    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=150,
            request_timeout=15,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"❌ 상황 프롬프트 생성 실패: {str(e)}")
        return ""


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
        return JSONResponse(
            status_code=500, content={"success": False, "error": "API key missing."}
        )
    
    logging.info(f"🐾 세션 아이디: {session_id}")
    translated_prompt = await get_translated_text(text)
    style_prompt = STYLE_PROMPTS.get(style, choice(list(STYLE_PROMPTS.values())))
    gender_en = GENDER_MAP.get(gender, choice(list(GENDER_MAP.values())))
    final_age = AGE_MAP.get(age, choice(list(AGE_MAP.values())))
    camera_prompt = "The character must be facing the camera or in a three-quarter view."
    
    negative_prompt_base = (
        "blurry, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, "
        "out of frame, extra limbs, disfigured, deformed, body out of frame, bad anatomy, "
        "watermark, signature, cut off, low contrast, underexposed, overexposed, "
        "bad art, beginner, amateur, distorted face,"
        "(text:1.5), (watermark:1.5), (logo:1.5), (words:1.5), (letters:1.5), "
        "(typography:1.5), (font:1.5), (captions:1.5), (subtitles:1.5), (speech bubbles:1.5), "
        "back view, from behind, turned away, back of head, character facing away"
    )
    
    if image:
        ethnicity_keyword = "Korean" if contains_korean(text) else ""
        no_text_prompt = "A clean image with no text, watermarks, or logos."
        
        if style == "realistic":
            subject_prompt = f"A photorealistic portrait of a {final_age} {ethnicity_keyword} {gender_en}."
            reimagine_prompt = (
                "Create a new, photorealistic image. The character should be the gender and age "
                "specified in the subject description. Take inspiration for the facial features "
                "and overall mood from the reference photo, but prioritize creating a realistic "
                "image of the correct subject."
            )
            final_prompt_parts = [
                reimagine_prompt, translated_prompt, style_prompt,
                subject_prompt, no_text_prompt, camera_prompt
            ]
            image_guidance_scale_value = 0.5

        elif style == "2d" or style == "3d" or style == "cyberpunk":
            subject_prompt = f"A {style} character of a {final_age} {ethnicity_keyword} {gender_en}"
            face_guidance_prompt = (
                f"The character's face should be clearly inspired by the reference photo, "
                f"but rendered beautifully in the requested {style} art style."
            )
            final_prompt_parts = [
                face_guidance_prompt, translated_prompt, style_prompt,
                subject_prompt, no_text_prompt, camera_prompt
            ]
            image_guidance_scale_value = 0.25
        
        elif style == "dot":
            subject_prompt = f"A {style} character of a {final_age} {ethnicity_keyword} {gender_en}"
            conversion_prompt = (
                "Convert the reference image into a 16-bit pixel art style. "
                "The final output must be pixelated."
            )
            final_prompt_parts = [
                conversion_prompt, translated_prompt, style_prompt,
                subject_prompt, no_text_prompt, camera_prompt
            ]
            image_guidance_scale_value = 0.15

        else:
            subject_prompt = f"A {style} character of a {final_age} {ethnicity_keyword} {gender_en}"
            face_guidance_prompt = (
                "The character's face should be clearly inspired by the reference photo, "
                "but rendered beautifully in the requested art style."
            )
            final_prompt_parts = [
                face_guidance_prompt, translated_prompt, style_prompt,
                subject_prompt, no_text_prompt, camera_prompt
            ]
            image_guidance_scale_value = 0.25

        composed_prompt = ". ".join(filter(None, final_prompt_parts))
        image_bytes = await image.read()
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        
        if gender == "male":
            negative_prompt_text = negative_prompt_base + ", woman, girl, female, feminine, girlish"
        elif gender == "female":
            negative_prompt_text = negative_prompt_base + ", man, boy, male, masculine, boyish"
        else:
            negative_prompt_text = negative_prompt_base
        
        payload = {
            "prompt": composed_prompt, "guidance_scale": 4,
            "image_guidance_scale": image_guidance_scale_value, "num_images": 1,
            "output_format": "png", "image_size": "portrait_4_3",
            "image_url": f"data:image/png;base64,{encoded_image}",
            "negative_prompt": negative_prompt_text,
        }
        
        logging.info(f"🐾 fal.ai 이미지 프롬프트: {composed_prompt}")
        try:
            img_result = await asyncio.to_thread(
                fal.run, FAL_IMAGE_MODEL_ENDPOINT, arguments=payload
            )
            final_image_url = img_result["images"][0]["url"]
        except Exception as e:
            logging.error(f"❌ fal.ai 이미지 처리 중 예외 발생: {e}")
            return JSONResponse(
                status_code=500, content={"success": False, "error": str(e)}
            )
            
    else:
        subject_prompt = f"A {final_age} {gender_en} person"
        final_prompt_parts = [
            translated_prompt, style_prompt, subject_prompt, camera_prompt
        ]
        composed_prompt = ". ".join(filter(None, final_prompt_parts))
        
        if gender == "male":
            negative_prompt_text = negative_prompt_base + ", woman, girl, female, feminine, girlish"
        elif gender == "female":
            negative_prompt_text = negative_prompt_base + ", man, boy, male, masculine, boyish"
        else:
            negative_prompt_text = negative_prompt_base

        payload = {
            "prompt": composed_prompt, "num_images": 1, "output_format": "png",
            "image_size": "portrait_4_3", "negative_prompt": negative_prompt_text,
        }

        logging.info(f"🐾 fal.ai 텍스트-이미지 프롬프트: {composed_prompt}")
        try:
            img_result = await asyncio.to_thread(
                fal.run, FAL_TEXT_TO_IMAGE_MODEL_ENDPOINT, arguments=payload
            )
            final_image_url = img_result["images"][0]["url"]
        except Exception as e:
            logging.error(f"❌ fal.ai 텍스트-이미지 처리 중 예외 발생: {e}")
            return JSONResponse(
                status_code=500, content={"success": False, "error": str(e)}
            )

    try:
        image_response = requests.get(final_image_url, timeout=20)
        image_response.raise_for_status()
        encoded_image = base64.b64encode(image_response.content).decode("utf-8")
        data_uri = f"data:image/png;base64,{encoded_image}"
        return JSONResponse(content={"success": True, "image": data_uri})
    except Exception as e:
        logging.error(f"❌ 최종 이미지 처리 중 예외 발생: {e}")
        return JSONResponse(
            status_code=500, content={"success": False, "error": str(e)}
        )

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