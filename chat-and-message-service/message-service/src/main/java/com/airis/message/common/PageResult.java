package com.airis.message.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * Page result
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Data list
     */
    private List<T> records;

    /**
     * Total count
     */
    private long total;

    /**
     * Current page number
     */
    private long current;

    /**
     * Page size
     */
    private long size;

    /**
     * Total pages
     */
    private long pages;

    /**
     * Has next page
     */
    private boolean hasNext;

    /**
     * Has previous page
     */
    private boolean hasPrevious;

    /**
     * Create page result
     * 
     * @param records Data list
     * @param total   Total count
     * @param current Current page number
     * @param size    Page size
     * @param <T>     Data type
     * @return Page result
     */
    public static <T> PageResult<T> of(List<T> records, long total, long current, long size) {
        long pages = (total + size - 1) / size;
        return PageResult.<T>builder()
                .records(records)
                .total(total)
                .current(current)
                .size(size)
                .pages(pages)
                .hasNext(current < pages)
                .hasPrevious(current > 1)
                .build();
    }
}