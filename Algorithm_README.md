# AIRIS Algorithm Guide

## Prerequisites
- Python 3.8+
- flask
- numpy
- scikit-learn
- sentence-transformers
- openai
- requests
- pillow

- Note: Make sure to download or place the sentence-transformer model (all-MiniLM-L6-v2) in the root directory or adjust its path.

## Environment Variables
```bash
# Set your DeepSeek API key in the environment before running save_info.py:
export DEEPSEEK_API_KEY="your-deepseek-api-key"
# Set Baidu API keys for image checking in check_img.py:
export BAIDU_API_KEY="your-baidu-api-key"
export BAIDU_SECRET_KEY="your-baidu-secret-key"
```

## Applications Structure
- **save_info.py**: Accepts and processes user data (info, preferences, behaviors), generates embeddings, and stores them in local Database.
- **recommend.py**: Returns a list of recommended users based on similarity between preference vectors and user info vectors.
- **match.py**: Returns highly matched users by combining preference matching and collaborative filtering with behavior logs.
- **check_img.py**: Provides image content moderation using Baidu Cloud API to ensure uploaded images meet compliance requirements.

## Project Structure
.
├── save_info.py          # User data ingestion, parsing, vectorization
├── recommend.py          # Preference-based recommendation service
├── match.py              # Matchmaking based on preferences + behaviors
├── check_img.py          # Image content moderation service
├── all-MiniLM-L6-v2/     # SentenceTransformer model directory

## Run

```bash
# 1. Upload and save user data
python save_info.py       # runs on http://localhost:9010

# 2. Recommend users by preference similarity
python recommend.py       # runs on http://localhost:9030

# 3. Match users using collaborative filtering
python match.py           # runs on http://localhost:9020

# 4. Run image content moderation service
python check_img.py       # runs on http://localhost:8080
```

## API Endpoints
1. /algorithm/batch-upload (POST) — from save_info.py
Upload multiple users at once.
Payload:
```json
[
  {
    "operation": "add",
    "id": 1,
    "gender": "M",
    "age": 25,
    "city": "Shanghai",
    "height": 175,
    "weight": 70,
    "education": "Bachelor",
    "occupation": "Engineer",
    "hobbies": ["hiking", "reading"],
    "preference": {
      "heightRange": {"min": 160, "max": 175},
      "weightRange": {"min": 50, "max": 70},
      "ageRange": {"min": 22, "max": 28},
      "preferredCities": ["Shanghai"],
      "hobbies": "I like people who are interested in traveling and reading.",
      "dealBreakers": "I don't really like people who love games.",
      "topPriorities": ["hobby", "city"],
      "sexualOrientation": "HETEROSEXUAL"
    },
    "likedUsers": [2, 3],
    "commentedUsers": {"2": 1},
    "messageCounts": {"3": 5}
  }
]
```

2. /recommend (POST) — from recommend.py
Get recommended users based on user’s preference vector.
Payload:
```json
{
  "userId": 1,
  "count": 10
}
```
Response:
```json
{
  "userIds": [3, 4, 5]
}
```

3. /highly-matched (POST) — from match.py
Get highly matched users using preference match + collaborative behavior.
Payload:
```json
{
  "userId": 1,
  "count": 10
}
```
Response:
```json
{
  "status": "success",
  "userIds": [4, 6, 8]
}
```

4. /api/review (POST) — from check_img.py
Review image content for compliance using Baidu Cloud API.
Payload:
```json
{
  "media_id": "image123",
  "image_url": "https://example.com/image.jpg"
}
```
Response:
```json
{
  "media_id": "image123",
  "result": "APPROVED"
}
```
OR
```json
{
  "media_id": "image123",
  "result": "ERROR",
  "error": "Error message"
}
```