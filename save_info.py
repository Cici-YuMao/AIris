from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from openai import OpenAI
import os, json

app = Flask(__name__)
embedding_model = SentenceTransformer("./all-MiniLM-L6-v2")

USER_INFO_DB = "user_info_db.json"
USER_PREF_DB = "user_pref_db.json"
VECTOR_DB = "user_vector_db.json"
BEHAVIOR_DB = "user_behavior_db.json"

# DeepSeek API Key (ensure this is set in your environment)
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-1604a69cedaf4eed81ffc5f00ebbc178")

# 初始化 OpenAI 客户端
client = OpenAI(api_key= "sk-1604a69cedaf4eed81ffc5f00ebbc178", base_url="https://api.deepseek.com")

for f in [USER_INFO_DB, USER_PREF_DB, VECTOR_DB, BEHAVIOR_DB]:
    if not os.path.exists(f):
        with open(f, "w") as fp:
            json.dump([], fp)

def load_db(file): 
    return json.load(open(file, "r", encoding="utf-8"))

def save_db(file, data): 
    json.dump(data, open(file, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

def user_to_info_entry(user):
    return {
        "id": user["id"],
        "gender": user.get("gender"),
        "age": user.get("age"),
        "height": user.get("height"),
        "weight": user.get("weight"),
        "city": user.get("city"),
        "education": user.get("education"),
        "occupation": user.get("occupation"),
        "hobbies": user.get("hobbies", [])
    }

def flatten_user_info(user):
    return f"身高{user.get('height')} 体重{user.get('weight')} 年龄{user.get('age')} 城市{user.get('city')} 学历{user.get('education')} 职业{user.get('occupation')} 爱好:{','.join(user.get('hobbies', []))}"

def refine_preferences_with_deepseek(raw_pref):
    # 确保输入包含所有字段，设置默认值
    raw_pref = {k: raw_pref.get(k, "") for k in ["heightRange", "weightRange", "ageRange", "preferredCities", "hobbies", "dealBreakers", "topPriorities", "sexualOrientation"]}
    # print('原始数据',raw_pref)
    prompt = """
请根据以下用户偏好信息提取结构化标签：
- 爱好：从“{hobbies}”中提取具体兴趣爱好词汇，输出为逗号分隔的字符串，如“音乐,戏剧”。只提取具体兴趣词汇，避免描述性语句。
- 雷点：从“{dealBreakers}”中提取明确的负面标签，输出为逗号分隔的字符串，如“吸烟,酗酒”。只提取具体负面标签，避免描述性语句。

示例：
输入爱好：“希望能认识喜欢音乐、戏剧的朋友”
输出爱好：“音乐,戏剧”
输入雷点：“非常不喜欢吸烟的人”
输出雷点：“吸烟”

请输出为 JSON 格式，包含以下字段：
```json
{{
  "爱好": "<提取的爱好词汇，逗号分隔>",
  "雷点": "<提取的雷点词汇，逗号分隔>"
}}
```
""".format(hobbies=raw_pref["hobbies"], dealBreakers=raw_pref["dealBreakers"])
    
    try:
        if DEEPSEEK_API_KEY == "your-deepseek-api-key-here":
            raise ValueError("Invalid DeepSeek API key")
        
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant specializing in extracting structured tags from text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            stream=False
        )
        
        result = response.choices[0].message.content.strip()
        print("DeepSeek API response:", result)  # 调试：打印 API 响应
        if result.startswith("```json"):
            result = result[7:].strip()
        if result.endswith("```"):
            result = result[:-3].strip()
        parsed = json.loads(result)
        mapping = {
            "爱好": "hobby",
            "雷点": "dislike"
        }
        parsed = {mapping.get(k, k): v for k, v in parsed.items()}
        # 确保 hobby 和 dislike 是列表
        hobby = parsed.get("hobby", "")
        dislike = parsed.get("dislike", "")
        hobby_list = [v.strip() for v in hobby.split(",") if v.strip()] if isinstance(hobby, str) and hobby else []
        dislike_list = [v.strip() for v in dislike.split(",") if v.strip()] if isinstance(dislike, str) and dislike else []
        # 直接使用原始输入的 height, weight, age, city
        return {
            "height": f"{raw_pref["heightRange"]['min']}-{raw_pref["heightRange"]['max']}",
            "weight": f"{raw_pref['weightRange']['min']}-{raw_pref['weightRange']['max']}",
            "age": f"{raw_pref['ageRange']['min']}-{raw_pref['ageRange']['max']}",
            "city": ",".join(raw_pref['preferredCities']),
            "hobby": hobby_list,
            "dislike": dislike_list,
            "topPriorities": ",".join(raw_pref['topPriorities']) if isinstance(raw_pref['topPriorities'], list) else raw_pref['topPriorities'],
            "sexualOrientation": raw_pref["sexualOrientation"] 
        }
    except Exception as e:
        print(f"Error refining preferences: {e}")
        # 回退逻辑：尝试从原始输入提取标签
        hobby_list = []
        dislike_list = []
        if isinstance(raw_pref["hobbies"], str) and raw_pref["hobbies"]:
            # 移除常见描述性词语
            hobby_text = raw_pref["hobbies"]
            for keyword in ["希望", "能认识", "喜欢", "的朋友", "想找", "想要"]:
                hobby_text = hobby_text.replace(keyword, "")
            # 按逗号或中文逗号拆分
            hobby_list = [v.strip() for v in hobby_text.replace("、", ",").split(",") if v.strip()]
        if isinstance(raw_pref["dealBreakers"], str) and raw_pref["dealBreakers"]:
            # 移除常见描述性词语
            dislike_text = raw_pref["dealBreakers"]
            for keyword in ["非常", "不喜欢", "讨厌", "的人", "不接受"]:
                dislike_text = dislike_text.replace(keyword, "")
            dislike_list = [v.strip() for v in dislike_text.replace("、", ",").split(",") if v.strip()]
        return {
            "height": f"{raw_pref["heightRange"]['min']}-{raw_pref["heightRange"]['max']}",
            "weight": f"{raw_pref['weightRange']['min']}-{raw_pref['weightRange']['max']}",
            "age": f"{raw_pref['ageRange']['min']}-{raw_pref['ageRange']['max']}",
            "city": ",".join(raw_pref['preferredCities']),
            "hobby": hobby_list,
            "dislike": dislike_list,
            "topPriorities": ",".join(raw_pref['topPriorities']) if isinstance(raw_pref['topPriorities'], list) else raw_pref['topPriorities'],
            "sexualOrientation": raw_pref["sexualOrientation"] 
        }

@app.route("/algorithm/batch-upload", methods=["POST"])
def batch_upload():
    try:
        payload = request.get_json()
        print("YUANSHI",payload)
        if not isinstance(payload, list):
            return jsonify({"status": "error", "message": "Payload should be a list"})

        info_db = load_db(USER_INFO_DB)
        pref_db = load_db(USER_PREF_DB)
        vector_db = load_db(VECTOR_DB)
        behavior_db = load_db(BEHAVIOR_DB)

        for item in payload:
            uid = item.get("id")
            op = item.get("operation")
            if not uid or not op:
                continue

            # 删除操作
            if op == "delete":
                info_db = [u for u in info_db if u["id"] != uid]
                pref_db = [p for p in pref_db if p["id"] != uid]
                vector_db = [v for v in vector_db if v["id"] != uid]
                behavior_db = [b for b in behavior_db if b["id"] != uid]
                continue

            # 1. 用户结构化信息保存
            info_entry = user_to_info_entry(item)
            info_db = [u for u in info_db if u["id"] != uid] + [info_entry]

            # 2. 用户偏好信息保存
            if "preference" in item and item["preference"]:
                refined_pref = refine_preferences_with_deepseek(item["preference"])
                print("Refined preference:", refined_pref)  # 调试：打印处理后的偏好
                pref_entry = {"id": uid, "data": refined_pref}
                pref_db = [p for p in pref_db if p["id"] != uid] + [pref_entry]
            else:
                pref_db = [p for p in pref_db if p["id"] != uid]

            # 3. 向量计算与保存
            user_desc = flatten_user_info(info_entry)
            embedding = embedding_model.encode(user_desc).tolist()
            user_vector = [0] * 5
            pref_vector = [0] * 5
            vector_entry = {
                "id": uid,
                "user_vector": user_vector,
                "embedding": embedding,
                "pref_vector": pref_vector
            }
            vector_db = [v for v in vector_db if v["id"] != uid] + [vector_entry]

            # 4. 行为日志信息保存
            behavior_entry = {
                "id": uid,
                "likedUsers": item.get("likedUsers", {}),
                "commentedUsers": item.get("commentedUsers", {}),
                "messageCounts": item.get("messageCounts", 0)
            }
            behavior_db = [b for b in behavior_db if b["id"] != uid] + [behavior_entry]

        # 保存所有 DB
        save_db(USER_INFO_DB, info_db)
        save_db(USER_PREF_DB, pref_db)
        save_db(VECTOR_DB, vector_db)
        save_db(BEHAVIOR_DB, behavior_db)

        return jsonify({"status": "success", "message": "Batch processed."})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9010)