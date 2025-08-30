package com.airis.match.repository;

import com.airis.match.entity.UserPreference;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserPreferenceRepository extends MongoRepository<UserPreference, String> {
    Optional<UserPreference> findByUserId(Long userId);
}

