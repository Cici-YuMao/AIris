package com.airis.match.service.impl;

import com.airis.match.dto.CommentResponse;
import com.airis.match.dto.MatchUserDetailResponse;
import com.airis.match.dto.UserInfoResponse;
import com.airis.match.dto.UserPreferenceResponse;
import com.airis.match.entity.User;
import com.airis.match.entity.UserPreference;
import com.airis.match.repository.UserPreferenceRepository;
import com.airis.match.repository.UserRepository;
import com.airis.match.service.MatchService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class MatchServiceImpl implements MatchService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPreferenceRepository userPreferenceRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${algo.recommend.url:http://10.144.136.83:9030/recommend}")
    private String algoRecommendUrl;

    @Value("${algo.match.url:http://10.144.136.83:9020/highly-matched}")
    private String algoMatchUrl;

    @Value("${media.service.url:http://10.144.122.245:8081}")
    private String mediaServiceUrl;

    @Value("${user.service.url:http://localhost:8081}")
    private String userServiceUrl;

    // 缓存过期时间（小时）
    private static final int CACHE_EXPIRE_HOURS = 2;

    @Override
    public List<MatchUserDetailResponse> getHotUsers(int count) {
        String cacheKey = "match:hot-users:" + count;

        // 先从缓存获取
        List<Long> cachedIds = getCachedUserIds(cacheKey);
        if (cachedIds != null && !cachedIds.isEmpty()) {
            System.out.println("从缓存获取热门用户");
            return cachedIds.stream()
                    .map(this::getUserDetail)
                    .collect(Collectors.toList());
        }

        // 缓存未命中，从数据库获取
        System.out.println("缓存未命中，从数据库获取热门用户");
        List<User> hotUsers = userRepository.findAllByOrderByPopularityDesc();

        if (count > 0) {
            hotUsers = hotUsers.stream()
                .limit(count)
                .collect(Collectors.toList());
        }

        // 存入缓存
        List<Long> userIds = hotUsers.stream()
                .map(User::getId)
                .collect(Collectors.toList());
        if (!userIds.isEmpty()) {
            cacheUserIds(cacheKey, userIds);
        }

        return hotUsers.stream()
            .map(this::convertToMatchUserDetailResponse)
            .collect(Collectors.toList());
    }

    @Override
    public List<MatchUserDetailResponse> recommend(Long userId, int count) {
        String cacheKey = "match:recommend:" + userId + ":" + count;

        // 先从缓存获取
        List<Long> cachedIds = getCachedUserIds(cacheKey);
        if (cachedIds != null && !cachedIds.isEmpty()) {
            System.out.println("从缓存获取推荐结果，用户ID: " + userId);
            return cachedIds.stream()
                    .map(this::getUserDetail)
                    .collect(Collectors.toList());
        }

        // 缓存未命中，调用算法服务
        System.out.println("缓存未命中，调用算法服务获取推荐，用户ID: " + userId);
        List<Long> ids = getUserIdsFromAlgo(userId, count, algoRecommendUrl);

        // 存入缓存
        if (!ids.isEmpty()) {
            cacheUserIds(cacheKey, ids);
        }

        return ids.stream()
                .map(this::getUserDetail)
                .collect(Collectors.toList());
    }

    @Override
    public List<MatchUserDetailResponse> match(Long userId, int count) {
        String cacheKey = "match:highly-matched:" + userId + ":" + count;

        // 先从缓存获取
        List<Long> cachedIds = getCachedUserIds(cacheKey);
        if (cachedIds != null && !cachedIds.isEmpty()) {
            System.out.println("从缓存获取高匹配结果，用户ID: " + userId);
            return cachedIds.stream()
                    .map(this::getUserDetail)
                    .collect(Collectors.toList());
        }

        // 缓存未命中，调用算法服务
        System.out.println("缓存未命中，调用算法服务获取高匹配，用户ID: " + userId);
        List<Long> ids = getUserIdsFromAlgo(userId, count, algoMatchUrl);

        // 存入缓存
        if (!ids.isEmpty()) {
            cacheUserIds(cacheKey, ids);
        }

        return ids.stream()
                .map(this::getUserDetail)
                .collect(Collectors.toList());
    }

    @Override
    public MatchUserDetailResponse getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserPreference pref = userPreferenceRepository.findByUserId(userId)
                .orElse(null);

        List<String> photoUrls = getUserPhotos(userId);

        MatchUserDetailResponse resp = new MatchUserDetailResponse();

        // 个人信息
        UserInfoResponse userInfo = new UserInfoResponse();
        userInfo.setId(user.getId());
        userInfo.setUsername(user.getUsername());
        userInfo.setEmail(user.getEmail());
        userInfo.setPhone(user.getPhone());
        userInfo.setAccountStatus(user.getAccountStatus());
        userInfo.setCreatedAt(user.getCreatedAt().toString());
        userInfo.setUpdatedAt(user.getUpdatedAt().toString());
        userInfo.setName(user.getName());
        userInfo.setGender(user.getGender());
        userInfo.setAge(user.getAge());
        userInfo.setSexualOrientation(user.getSexualOrientation());
        userInfo.setHeight(user.getHeight());
        userInfo.setWeight(user.getWeight());
        userInfo.setCity(user.getCity());
        userInfo.setEducation(user.getEducation());
        userInfo.setOccupation(user.getOccupation());
        userInfo.setHobbies(user.getHobbies());
        userInfo.setPets(user.getPets());
        userInfo.setFamilyStatus(user.getFamilyStatus());
        userInfo.setIpAddress(user.getIpAddress());
        userInfo.setPopularity(user.getPopularity());

        // 从用户服务获取互动统计数据
        try {
            Map<String, Object> interactionData = getUserInteractionData(userId);
            userInfo.setLikeCount((Integer) interactionData.get("likeCount"));
            userInfo.setCommentCount((Integer) interactionData.get("commentCount"));
            userInfo.setComments((List<CommentResponse>) interactionData.get("comments"));
        } catch (Exception e) {
            System.err.println("获取用户互动数据失败: " + e.getMessage());
            userInfo.setLikeCount(0);
            userInfo.setCommentCount(0);
            userInfo.setComments(new ArrayList<>());
        }

        resp.setUserInfo(userInfo);

        // 偏好
        if (pref != null) {
            UserPreferenceResponse prefResp = new UserPreferenceResponse();
            prefResp.setAgeRange(pref.getAgeRange());
            prefResp.setHeightRange(pref.getHeightRange());
            prefResp.setWeightRange(pref.getWeightRange());
            prefResp.setSexualOrientation(pref.getSexualOrientation());
            prefResp.setPreferredEducation(pref.getPreferredEducation());
            prefResp.setPreferredOccupation(pref.getPreferredOccupation());
            prefResp.setPreferredCities(pref.getPreferredCities());
            prefResp.setHobbies(pref.getHobbies());
            prefResp.setDealBreakers(pref.getDealBreakers());
            prefResp.setTopPriorities(pref.getTopPriorities());
            resp.setUserPreference(prefResp);
        }

        resp.setPhotoUrls(photoUrls);
        return resp;
    }

    @Override
    public void clearUserMatchCache(Long userId) {
        try {
            String pattern = "match:*:" + userId + ":*";
            Set<String> keys = new HashSet<>();

            // 使用scan代替keys
            redisTemplate.execute((org.springframework.data.redis.core.RedisCallback<Object>) connection -> {
                org.springframework.data.redis.core.Cursor<byte[]> cursor = connection.scan(
                    org.springframework.data.redis.core.ScanOptions.scanOptions()
                        .match(pattern)
                        .count(1000)
                        .build()
                );
                while (cursor.hasNext()) {
                    keys.add(new String(cursor.next()));
                }
                cursor.close();
                return null;
            });

            if (!keys.isEmpty()) {
                redisTemplate.delete(keys);
                System.out.println("清空用户匹配缓存成功，用户ID: " + userId + ", 清理数量: " + keys.size());
            } else {
                System.out.println("用户 " + userId + " 没有找到匹配缓存");
            }
        } catch (Exception e) {
            System.err.println("清空用户匹配缓存失败: " + e.getMessage());

            // 回退到keys方法
            try {
                Set<String> keys = redisTemplate.keys("match:*:" + userId + ":*");
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                    System.out.println("使用keys方法清空用户缓存成功，用户ID: " + userId + ", 清理数量: " + keys.size());
                }
            } catch (Exception fallbackException) {
                System.err.println("回退清理用户缓存也失败: " + fallbackException.getMessage());
            }
        }
    }

    /**
     * 通用方法，调用算法同学的接口获取用户ID列表
     */
    private List<Long> getUserIdsFromAlgo(Long userId, int count, String url) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("userId", userId);
            requestBody.put("count", count);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                List<Integer> userIds = (List<Integer>) responseBody.get("userIds");
                List<Long> result = new ArrayList<>();
                if (userIds != null) {
                    for (Integer id : userIds) {
                        result.add(id.longValue());
                    }
                }
                return result;
            } else {
                throw new RuntimeException("Algorithm service request failed, status code: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("Algorithm service call exception: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    /**
     * 获取用户照片
     */
    public List<String> getUserPhotos(Long userId) {
        try {
            String url = mediaServiceUrl + "/media/public/images?userId=" + userId;
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode dataArray = root.path("data");
                List<String> urls = new ArrayList<>();
                if (dataArray.isArray()) {
                    for (JsonNode item : dataArray) {
                        String photoUrl = item.path("url").asText();
                        if (photoUrl != null && !photoUrl.isEmpty()) {
                            urls.add(photoUrl);
                        }
                    }
                }
                return urls;
            }
        } catch (Exception e) {
            // 记录错误但不抛出异常，返回空列表
            System.err.println("Failed to get user photos, userId: " + userId + ", error: " + e.getMessage());
        }
        return Collections.emptyList(); // 失败时返回空列表，不影响其他数据
    }

    /**
     * 从用户服务获取互动数据
     */
    private Map<String, Object> getUserInteractionData(Long userId) {
        try {
            String url = userServiceUrl + "/internal-api/v1/users/" + userId + "/interaction-data";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
        } catch (Exception e) {
            System.err.println("获取用户互动数据失败: " + e.getMessage());
        }
        return new HashMap<>();
    }

    private MatchUserDetailResponse convertToMatchUserDetailResponse(User user) {
        MatchUserDetailResponse resp = new MatchUserDetailResponse();

        // 个人信息
        UserInfoResponse userInfo = new UserInfoResponse();
        userInfo.setId(user.getId());
        userInfo.setUsername(user.getUsername());
        userInfo.setEmail(user.getEmail());
        userInfo.setPhone(user.getPhone());
        userInfo.setAccountStatus(user.getAccountStatus());
        userInfo.setCreatedAt(user.getCreatedAt().toString());
        userInfo.setUpdatedAt(user.getUpdatedAt().toString());
        userInfo.setName(user.getName());
        userInfo.setGender(user.getGender());
        userInfo.setAge(user.getAge());
        userInfo.setSexualOrientation(user.getSexualOrientation());
        userInfo.setHeight(user.getHeight());
        userInfo.setWeight(user.getWeight());
        userInfo.setCity(user.getCity());
        userInfo.setEducation(user.getEducation());
        userInfo.setOccupation(user.getOccupation());
        userInfo.setHobbies(user.getHobbies());
        userInfo.setPets(user.getPets());
        userInfo.setFamilyStatus(user.getFamilyStatus());
        userInfo.setIpAddress(user.getIpAddress());
        userInfo.setPopularity(user.getPopularity());

        // 从用户服务获取互动统计数据
        try {
            Map<String, Object> interactionData = getUserInteractionData(user.getId());
            userInfo.setLikeCount((Integer) interactionData.get("likeCount"));
            userInfo.setCommentCount((Integer) interactionData.get("commentCount"));
        } catch (Exception e) {
            userInfo.setLikeCount(0);
            userInfo.setCommentCount(0);
        }

        resp.setUserInfo(userInfo);

        // 偏好
        UserPreference pref = userPreferenceRepository.findByUserId(user.getId())
                .orElse(null);

        if (pref != null) {
            UserPreferenceResponse prefResp = new UserPreferenceResponse();
            prefResp.setAgeRange(pref.getAgeRange());
            prefResp.setHeightRange(pref.getHeightRange());
            prefResp.setWeightRange(pref.getWeightRange());
            prefResp.setSexualOrientation(pref.getSexualOrientation());
            prefResp.setPreferredEducation(pref.getPreferredEducation());
            prefResp.setPreferredOccupation(pref.getPreferredOccupation());
            prefResp.setPreferredCities(pref.getPreferredCities());
            prefResp.setHobbies(pref.getHobbies());
            prefResp.setDealBreakers(pref.getDealBreakers());
            prefResp.setTopPriorities(pref.getTopPriorities());
            resp.setUserPreference(prefResp);
        }

        List<String> photoUrls = getUserPhotos(user.getId());
        resp.setPhotoUrls(photoUrls);
        return resp;
    }

    /**
     * 从缓存获取用户ID列表
     */
    @SuppressWarnings("unchecked")
    private List<Long> getCachedUserIds(String cacheKey) {
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached instanceof List) {
                return (List<Long>) cached;
            }
        } catch (Exception e) {
            System.err.println("获取缓存失败: " + e.getMessage());
        }
        return null;
    }

    /**
     * 缓存用户ID列表
     */
    private void cacheUserIds(String cacheKey, List<Long> userIds) {
        try {
            redisTemplate.opsForValue().set(cacheKey, userIds, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
            System.out.println("缓存匹配结果成功，key: " + cacheKey + ", 数量: " + userIds.size());
        } catch (Exception e) {
            System.err.println("缓存匹配结果失败: " + e.getMessage());
        }
    }

    /**
     * 定时清空匹配缓存（每天凌晨2点执行）
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void clearMatchCache() {
        clearAllMatchCache();
    }

    @Override
    public void clearAllMatchCache() {
        try {
            // 使用scan代替keys以提高性能
            Set<String> keys = new HashSet<>();
            redisTemplate.execute((org.springframework.data.redis.core.RedisCallback<Object>) connection -> {
                org.springframework.data.redis.core.Cursor<byte[]> cursor = connection.scan(
                    org.springframework.data.redis.core.ScanOptions.scanOptions()
                        .match("match:*")
                        .count(1000)
                        .build()
                );
                while (cursor.hasNext()) {
                    keys.add(new String(cursor.next()));
                }
                cursor.close();
                return null;
            });

            if (!keys.isEmpty()) {
                redisTemplate.delete(keys);
                System.out.println("清空所有匹配缓存成功，清理数量: " + keys.size());
            } else {
                System.out.println("没有找到需要清理的匹配缓存");
            }
        } catch (Exception e) {
            System.err.println("清空所有匹配缓存失败: " + e.getMessage());
            e.printStackTrace();

            // 如果scan失败，回退到keys方法
            try {
                System.out.println("回退到keys方法清理缓存...");
                Set<String> keys = redisTemplate.keys("match:*");
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                    System.out.println("使用keys方法清空缓存成功，清理数量: " + keys.size());
                }
            } catch (Exception fallbackException) {
                System.err.println("回退清理方法也失败: " + fallbackException.getMessage());
            }
        }
    }
}

