from flask import Flask, request, jsonify
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import os

app = Flask(__name__)

USER_INFO_DB = "user_info_db.json"
USER_PREF_DB = "user_pref_db.json"
VECTOR_DB = "user_vector_db.json"
BEHAVIOR_DB = "user_behavior_db.json"

def load_db(file):
    if not os.path.exists(file):
        return []
    with open(file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.route("/highly-matched", methods=["POST"])
def highly_matched():
    try:
        payload = request.get_json()
        user_id = payload.get("userId")
        top_n = payload.get("count", 10)

        if not user_id:
            return jsonify({"status": "error", "message": "Missing userId"}), 400

        info_db = load_db(USER_INFO_DB)
        pref_db = load_db(USER_PREF_DB)
        vector_db = load_db(VECTOR_DB)
        behavior_db = load_db(BEHAVIOR_DB)

        # ---------- 性别 + 性取向匹配函数 ---------- #
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

        current_info = next((u for u in info_db if u["id"] == user_id), {})
        current_pref = next((p for p in pref_db if p["id"] == user_id), {}).get("data", {})
        current_gender = current_info.get("gender")
        current_orientation = current_pref.get("sexualOrientation", "").strip()

        user_vec_entry = next((v for v in vector_db if v["id"] == user_id), None)
        if not user_vec_entry:
            return jsonify({"status": "error", "message": "User vector not found"}), 404

        target_pref_vector = np.array(user_vec_entry["pref_vector"]).reshape(1, -1)

        # ---------- 1. 偏好匹配得分 ---------- #
        score_dict = {}
        for entry in vector_db:
            uid = entry["id"]
            if uid == user_id:
                continue
            target_info = next((u for u in info_db if u["id"] == uid), {})
            target_gender = target_info.get("gender")

            if not match_sexual_orientation(current_gender, current_orientation, target_gender):
                continue

            user_vector = np.array(entry["user_vector"]).reshape(1, -1)
            score = cosine_similarity(target_pref_vector, user_vector)[0][0]
            score_dict[uid] = score

        # ---------- 1.1 加权加分（最看重项） ---------- #
        top_priority = current_pref.get("topPriorities", [])
        if isinstance(top_priority, str):
            top_priority = [top_priority]

        for entry in info_db:
            uid = entry["id"]
            if uid == user_id or uid not in score_dict:
                continue
            match_score = 0
            for field in ["city", "hobby", "height", "weight", "age"]:
                pref_val = current_pref.get(field)
                info_val = entry.get(field)
                if not pref_val or not info_val:
                    continue
                if isinstance(pref_val, list) and isinstance(info_val, list):
                    matched = any(p == i for p in pref_val for i in info_val)
                elif isinstance(pref_val, list):
                    matched = any(p == info_val for p in pref_val)
                elif isinstance(info_val, list):
                    matched = any(i == pref_val for i in info_val)
                else:
                    matched = str(pref_val) == str(info_val)

                if matched:
                    if field in top_priority:
                        match_score += 5
                    else:
                        match_score += 2
            score_dict[uid] += match_score * 0.01

        # ---------- 2. 协同过滤得分 ---------- #
        similarities = []
        for entry in vector_db:
            uid = entry["id"]
            if uid == user_id:
                continue

            target_info = next((u for u in info_db if u["id"] == uid), {})
            target_gender = target_info.get("gender")

            if not match_sexual_orientation(current_gender, current_orientation, target_gender):
                continue

            pref_vec = np.array(entry["pref_vector"]).reshape(1, -1)
            sim = cosine_similarity(target_pref_vector, pref_vec)[0][0]
            similarities.append((uid, sim))

        similarities.sort(key=lambda x: -x[1])
        similar_users = [uid for uid, _ in similarities[:10]]

        # ---------- 行为分数 ---------- #
        behavior_score = {}
        for entry in behavior_db:
            if entry["id"] not in similar_users:
                continue

            liked_users = entry.get("likedUsers", {})
            if isinstance(liked_users, list):
                for uid in liked_users:
                    uid = str(uid)
                    behavior_score[uid] = behavior_score.get(uid, 0) + 3
            elif isinstance(liked_users, dict):
                for uid, count in liked_users.items():
                    behavior_score[uid] = behavior_score.get(uid, 0) + 3 * count

            commented_users = entry.get("commentedUsers", {})
            for uid, count in commented_users.items():
                behavior_score[uid] = behavior_score.get(uid, 0) + 2 * count

            message_counts = entry.get("messageCounts", {})
            for uid, count in message_counts.items():
                behavior_score[uid] = behavior_score.get(uid, 0) + 1 * count

        # ---------- 3. 得分融合 ---------- #
        total_users = len(info_db)
        alpha = max(0.3, 1 - total_users / 1000)

        final_scores = {}
        for uid in score_dict:
            sim_score = score_dict.get(uid, 0)
            cf_score = behavior_score.get(str(uid), 0)
            total_score = alpha * sim_score + (1 - alpha) * (cf_score / 10)
            final_scores[uid] = total_score

        top_matches = sorted(final_scores.items(), key=lambda x: -x[1])[:top_n]
        result_ids = [uid for uid, _ in top_matches]
        print(result_ids)
        return jsonify({"status": "success", "userIds": result_ids})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9020)
