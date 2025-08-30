from flask import Flask, request, jsonify
import requests
from io import BytesIO
from PIL import Image
import base64
import os
import json
import time

app = Flask(__name__)

# 百度云 API Key 和 Secret Key（请替换为你自己的）
BAIDU_API_KEY = os.getenv("BAIDU_API_KEY", "kbye8lYUP2HkZb3VDS8uLb3o")
BAIDU_SECRET_KEY = os.getenv("BAIDU_SECRET_KEY", "HaFe4Zryrt8QsI92gJUaKpt6VosKAerc")

def get_access_token():
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {
        "grant_type": "client_credentials",
        "client_id": BAIDU_API_KEY,
        "client_secret": BAIDU_SECRET_KEY
    }
    response = requests.post(url, params=params)
    token = response.json().get("access_token")
    if not token:
        raise Exception("无法获取 access_token")
    return token

def download_and_compress_image(image_url, max_size=512, quality=70):
    try:
        print(f"🔵 开始下载图片: {image_url}")
        response = requests.get(image_url, timeout=15)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content))
        
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)
            print(f"🟢 图片尺寸调整: {img.size}")
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        compressed_data = buffer.getvalue()
        
        print(f"🟢 图片压缩成功: {len(response.content)} → {len(compressed_data)} 字节")
        return compressed_data
        
    except Exception as e:
        print(f"⚠️ 图片处理错误: {e}")
        raise Exception(f"图片处理失败: {str(e)}")

def audit_image(image_data):
    try:
        access_token = get_access_token()
        print(f"🟡 Access Token 获取成功")

        url = f"https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token={access_token}"

        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        img_base64 = base64.b64encode(image_data).decode("utf-8")
        data = {
            "image": img_base64
        }

        response = requests.post(url, headers=headers, data=data, timeout=20)
        print(f"🟢 百度API状态码: {response.status_code}")
        print(f"🟢 返回内容: {response.text}")

        if response.status_code != 200:
            raise Exception("百度内容审核API请求失败")

        result = response.json()
        conclusion = result.get("conclusion", "")
        print(f"🟢 审核结论: {conclusion}")

        if "不合规" in conclusion or "复审" in conclusion:
            return "REJECTED"
        return "APPROVED"
    
    except Exception as e:
        print(f"🔴 百度内容审核失败: {e}")
        raise Exception(f"AI审核失败: {str(e)}")

@app.route("/api/review", methods=["POST"])
def review_image():
    media_id = None
    try:
        req_data = request.get_json()
        if not req_data:
            return jsonify({"result": "ERROR", "error": "缺少请求数据"}), 400
        
        media_id = req_data.get("media_id")
        image_url = req_data.get("image_url")
        
        print(f"🔵 收到审核请求: media_id={media_id}")
        
        if not media_id or not image_url:
            return jsonify({
                "media_id": media_id or "unknown",
                "result": "ERROR",
                "error": "缺少media_id或image_url"
            }), 400

        image_data = download_and_compress_image(image_url, max_size=512, quality=70)
        result = audit_image(image_data)
        
        return jsonify({"media_id": media_id, "result": result}), 200

    except Exception as e:
        error_msg = f"处理失败: {str(e)}"
        print(f"🔴 {error_msg}")
        return jsonify({
            "media_id": media_id or "unknown",
            "result": "ERROR",
            "error": error_msg
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
