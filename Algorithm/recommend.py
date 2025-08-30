from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import json, os
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
embedding_model = SentenceTransformer("./all-MiniLM-L6-v2")

VECTOR_DB = "user_vector_db.json"
USER_INFO_DB = "user_info_db.json"
USER_PREF_DB = "user_pref_db.json"


def load_db(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_pref_vector_from_db(user_id):
    vectors = load_db(VECTOR_DB)
    for entry in vectors:
        if entry["id"] == user_id:
            return entry.get("pref_vector")
    return None

def get_user_pref_from_db(user_id):
    prefs = load_db(USER_PREF_DB)
    for entry in prefs:
        if entry["id"] == user_id:
            return entry.get("data")
    return None


def flatten_pref(p):
    return f"年龄{p.get('age')} 身高{p.get('height')} 体重{p.get('weight')} 城市{p.get('city')} 爱好:{','.join(p.get('hobby', []))} 雷点:{','.join(p.get('dislike', []))}"


def encode_pref_to_vector(pref_data):
    flat = flatten_pref(pref_data)
    return embedding_model.encode(flat).tolist()


def cosine_score(v1, v2):
    return cosine_similarity([v1], [v2])[0][0]


@app.route("/recommend", methods=["POST"])
def highly_matched():
    data = request.get_json()
    user_id = data.get("userId")
    count = data.get("count", 10)
    print("get userid and count", user_id, count)

    # 当前用户偏好与信息
    pref = get_user_pref_from_db(user_id)
    if not pref:
        return jsonify({"status": "error", "message": "No preference found for user"}), 400
    pref_vector = encode_pref_to_vector(pref)

    infos = {u["id"]: u for u in load_db(USER_INFO_DB)}
    vectors = load_db(VECTOR_DB)
    prefs = {p["id"]: p["data"] for p in load_db(USER_PREF_DB)}

    user_info = infos.get(user_id, {})
    user_gender = user_info.get("gender")
    user_orientation = pref.get("sexualOrientation", "").strip()

    top_priorities = pref.get("topPriorities", [])
    if isinstance(top_priorities, str):
        top_priorities = [x.strip() for x in top_priorities.replace("，", ",").split(",") if x.strip()]

    def match_sexual_orientation(my_gender, my_orientation, target_gender):
        if not my_gender or not my_orientation or not target_gender:
            return True  # 默认保留
        if my_orientation == "HETEROSEXUAL":
            return my_gender != target_gender
        elif my_orientation == "HOMOSEXUAL":
            return my_gender == target_gender
        elif my_orientation == "BISEXUAL":
            return True
        return True

    scores = []
    for v in vectors:
        uid = v["id"]
        if uid == user_id:
            continue
        info = infos.get(uid, {})
        
        if not match_sexual_orientation(user_gender, user_orientation, info.get("gender")):
            continue  # 跳过性别不匹配的用户

        # 1. 向量相似度得分（放大权重）
        score = cosine_score(v["embedding"], pref_vector) * 10

        # 2. 基于结构化字段的加权得分
        if pref:
            try:
                age_range = pref.get("age", "0-100").split("-")
                if len(age_range) == 2 and info.get("age"):
                    if int(age_range[0]) <= int(info["age"]) <= int(age_range[1]):
                        score += 5 if "age" in top_priorities else 2
            except Exception:
                pass

            # 城市
            if pref.get("city") and info.get("city"):
                pref_cities = pref["city"]
                if isinstance(pref_cities, str):
                    pref_cities = [c.strip() for c in pref_cities.replace("，", ",").split(",")]
                if info["city"] in pref_cities:
                    score += 5 if "city" in top_priorities else 2

            # 爱好匹配
            hobby_set = set(pref.get("hobby", []))
            info_hobby_set = set(info.get("hobbies", []))
            if hobby_set & info_hobby_set:
                score += 5 if "hobby" in top_priorities else 2

            # 雷点扣分
            dislike_set = set(pref.get("dislike", []))
            if dislike_set & info_hobby_set:
                score -= 10

        scores.append((uid, score))

    # 排序+过滤数量
    scores.sort(key=lambda x: x[1], reverse=True)
    top_ids = [uid for uid, _ in scores[:count]]
    print("result:", top_ids)
    return jsonify({"userIds": top_ids})



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9030)