package com.airis.message.util;

import org.springframework.stereotype.Component;

/**
 * Snowflake algorithm ID generator
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Component
public class SnowflakeIdGenerator {
    
    // Start timestamp (2024-01-01)
    private static final long START_TIMESTAMP = 1704067200000L;
    
    // Machine ID bits
    private static final long MACHINE_BIT = 5;
    // Data center ID bits
    private static final long DATACENTER_BIT = 5;
    // Sequence number bits
    private static final long SEQUENCE_BIT = 12;
    
    // Maximum values
    private static final long MAX_MACHINE_NUM = ~(-1L << MACHINE_BIT);
    private static final long MAX_DATACENTER_NUM = ~(-1L << DATACENTER_BIT);
    private static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BIT);
    
    // Left shift bits
    private static final long MACHINE_LEFT = SEQUENCE_BIT;
    private static final long DATACENTER_LEFT = SEQUENCE_BIT + MACHINE_BIT;
    private static final long TIMESTAMP_LEFT = DATACENTER_LEFT + DATACENTER_BIT;
    
    private final long datacenterId;
    private final long machineId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;
    
    /**
     * Constructor
     * 
     * @param datacenterId Data center ID
     * @param machineId Machine ID
     */
    public SnowflakeIdGenerator(long datacenterId, long machineId) {
        if (datacenterId > MAX_DATACENTER_NUM || datacenterId < 0) {
            throw new IllegalArgumentException("Data center ID cannot be greater than " + MAX_DATACENTER_NUM + " or less than 0");
        }
        if (machineId > MAX_MACHINE_NUM || machineId < 0) {
            throw new IllegalArgumentException("Machine ID cannot be greater than " + MAX_MACHINE_NUM + " or less than 0");
        }
        this.datacenterId = datacenterId;
        this.machineId = machineId;
    }
    
    /**
     * Default constructor
     */
    public SnowflakeIdGenerator() {
        this(1L, 1L);
    }
    
    /**
     * Generate next ID
     * 
     * @return ID
     */
    public synchronized long nextId() {
        long currentTimestamp = getCurrentTimestamp();
        
        if (currentTimestamp < lastTimestamp) {
            throw new RuntimeException("Clock moved backwards, refusing to generate ID");
        }
        
        if (currentTimestamp == lastTimestamp) {
            // Same millisecond, sequence number increments
            sequence = (sequence + 1) & MAX_SEQUENCE;
            // Sequence number reached maximum for same millisecond
            if (sequence == 0L) {
                currentTimestamp = getNextTimestamp();
            }
        } else {
            // Different millisecond, reset sequence number to 0
            sequence = 0L;
        }
        
        lastTimestamp = currentTimestamp;
        
        return (currentTimestamp - START_TIMESTAMP) << TIMESTAMP_LEFT // Timestamp part
                | datacenterId << DATACENTER_LEFT                    // Data center part
                | machineId << MACHINE_LEFT                          // Machine identifier part
                | sequence;                                          // Sequence number part
    }
    
    /**
     * Generate string ID
     * 
     * @return String ID
     */
    public String nextIdStr() {
        return String.valueOf(nextId());
    }
    
    /**
     * Get next timestamp
     * 
     * @return Timestamp
     */
    private long getNextTimestamp() {
        long timestamp = getCurrentTimestamp();
        while (timestamp <= lastTimestamp) {
            timestamp = getCurrentTimestamp();
        }
        return timestamp;
    }
    
    /**
     * Get current timestamp
     * 
     * @return Current timestamp
     */
    private long getCurrentTimestamp() {
        return System.currentTimeMillis();
    }
} 