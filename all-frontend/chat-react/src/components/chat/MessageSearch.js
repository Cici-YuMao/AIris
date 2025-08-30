import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import apiService from '../../services/chat/api';
import '../../styles/chat/MessageSearch.css';

const MessageSearch = ({ userId, currentChat, onClose, onMessageClick }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchFilters, setSearchFilters] = useState({
        dateRange: 'all', // Time range: all, today, week, month, custom
        customStartDate: '',
        customEndDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        // Auto-focus search input
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    const handleSearch = async (isLoadMore = false) => {
        if (!searchKeyword.trim() || !currentChat) {
            return;
        }

        setLoading(true);
        try {
            const page = isLoadMore ? currentPage + 1 : 1;
            const { startTimestamp, endTimestamp } = getTimestampRange();

            const result = await apiService.searchMessages(
                userId,
                searchKeyword.trim(),
                currentChat?.chatId || null,
                page,
                20,
                startTimestamp,
                endTimestamp
            );

            const newResults = result.records || [];

            if (isLoadMore) {
                setSearchResults(prev => [...prev, ...newResults]);
                setCurrentPage(page);
            } else {
                setSearchResults(newResults);
                setCurrentPage(1);
            }

            setHasMore(result.hasNext || false);
        } catch (error) {
            console.error('Search failed:', error);
            if (!currentChat) {
                alert('Please select a chat first to search messages.');
            } else {
                alert('Search failed. Please check your network connection or try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getTimestampRange = () => {
        const now = new Date();
        let startTimestamp = null;
        let endTimestamp = null;

        switch (searchFilters.dateRange) {
            case 'today':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                startTimestamp = today.getTime();
                endTimestamp = now.getTime();
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                startTimestamp = weekAgo.getTime();
                endTimestamp = now.getTime();
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                startTimestamp = monthAgo.getTime();
                endTimestamp = now.getTime();
                break;
            case 'custom':
                if (searchFilters.customStartDate) {
                    startTimestamp = new Date(searchFilters.customStartDate).getTime();
                }
                if (searchFilters.customEndDate) {
                    const endDate = new Date(searchFilters.customEndDate);
                    endDate.setHours(23, 59, 59, 999);
                    endTimestamp = endDate.getTime();
                }
                break;
            default:
                // 'all' - no timestamp limits
                break;
        }

        return { startTimestamp, endTimestamp };
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleFilterChange = (filterType, value) => {
        setSearchFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            handleSearch(true);
        }
    };

    // Remove getChatName function as we no longer need it

    const formatResultTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const highlightKeyword = (text, keyword) => {
        if (!keyword || !text) return text;

        const regex = new RegExp(`(${keyword})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ?
                <mark key={index} className="search-highlight">{part}</mark> :
                part
        );
    };

    const clearSearch = () => {
        setSearchKeyword('');
        setSearchResults([]);
        setCurrentPage(1);
        setHasMore(false);
    };

    return (
        <div className="message-search-overlay">
            <div className="message-search-container">
                {/* Header */}
                <div className="search-header">
                    <h3>Search in {currentChat?.otherUserNickname || currentChat?.otherUserId || 'Chat'}</h3>
                    <button onClick={onClose} className="close-btn" title="Close">
                        ×
                    </button>
                </div>

                {/* Search Input */}
                <div className="search-input-section">
                    <div className="search-input-container">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Enter keywords to search messages..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="search-input"
                        />
                        <button
                            onClick={() => handleSearch()}
                            disabled={loading || !searchKeyword.trim()}
                            className="search-btn"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                        {searchKeyword && (
                            <button onClick={clearSearch} className="clear-btn" title="Clear">
                                ×
                            </button>
                        )}
                    </div>

                    {/* Filters Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`filters-toggle ${showFilters ? 'active' : ''}`}
                    >
                        Filter Options {showFilters ? '▲' : '▼'}
                    </button>
                </div>

                {/* Search Filters */}
                {showFilters && (
                    <div className="search-filters">
                        <div className="filter-group">
                            <label>Time Range:</label>
                            <select
                                value={searchFilters.dateRange}
                                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Past Week</option>
                                <option value="month">Past Month</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {searchFilters.dateRange === 'custom' && (
                            <div className="filter-group custom-date">
                                <label>Start Date:</label>
                                <input
                                    type="date"
                                    value={searchFilters.customStartDate}
                                    onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                                />
                                <label>End Date:</label>
                                <input
                                    type="date"
                                    value={searchFilters.customEndDate}
                                    onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Search Results */}
                <div className="search-results">
                    {loading && searchResults.length === 0 ? (
                        <div className="search-loading">
                            <div className="loading-spinner"></div>
                            <span>Searching...</span>
                        </div>
                    ) : searchResults.length === 0 && searchKeyword ? (
                        <div className="no-results">
                            <div className="no-results-icon">🔍</div>
                            <p>No messages found containing "{searchKeyword}"</p>
                            <p className="hint">Try using different keywords or adjusting filter options</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <>
                            <div className="results-header">
                                Found {searchResults.length} results
                            </div>
                            <div className="results-list">
                                {searchResults.map((message, index) => (
                                    <div
                                        key={`${message.messageId}-${index}`}
                                        className="search-result-item"
                                        onClick={() => onMessageClick && onMessageClick(message)}
                                    >
                                        <div className="result-header">
                                            <span className="result-sender">
                                                {message.senderId === userId ? 'Me' : (message.senderId || 'Unknown')}
                                            </span>
                                            <span className="result-time">
                                                {formatResultTimestamp(message.timestamp)}
                                            </span>
                                        </div>
                                        <div className="result-content">
                                            {highlightKeyword(message.content, searchKeyword)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More */}
                            {hasMore && (
                                <div className="load-more-section">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="load-more-btn"
                                    >
                                        {loading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="search-empty">
                            <div className="search-empty-icon">💬</div>
                            <p>Enter keywords above to search messages in this chat</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageSearch; 