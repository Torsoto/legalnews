import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { API } from "../constants";
import * as bookmarkStorage from "../utils/bookmarkStorage";
import * as notificationStorage from "../utils/notificationStorage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { get } from "../utils/apiClient"; 

// Import components
import EmptyNewsState from "../components/LegalNewsScreen/EmptyNewsState";
import NewsCard from "../components/LegalNewsScreen/NewsCard";
import NewsHeader from "../components/LegalNewsScreen/NewsHeader";
import NewsTabSelector from "../components/LegalNewsScreen/NewsTabSelector";
import NewsFilters from "../components/LegalNewsScreen/NewsFilters";

// Use the stored-notifications endpoint for fetching news
const SERVER_URL = API.BASE_URL + API.ENDPOINTS.STORED_NOTIFICATIONS;

const LegalNewsScreen = ({ navigation }) => {
  const [allNews, setAllNews] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [bookmarkedNews, setBookmarkedNews] = useState({});
  const [filterActive, setFilterActive] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabView, setTabView] = useState('all'); // 'all' or 'notifications'
  const [unreadCount, setUnreadCount] = useState(0);
  const [sortAscending, setSortAscending] = useState(false); // false = newest first (descending)
  const [deletedNotifications, setDeletedNotifications] = useState({});
  const [readNotifications, setReadNotifications] = useState({});

  // Load bookmarks, notifications and news on mount
  useEffect(() => {
    const loadData = async () => {
      await loadBookmarks();
      await loadNotificationStatus();
      fetchNews();
    };
    
    loadData();

    // Add a listener for when the screen is focused
    const unsubscribe = navigation.addListener('focus', async () => {
      await loadBookmarks();
      await loadNotificationStatus();
    });

    return unsubscribe;
  }, [navigation]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    if (allNews.length > 0) {
      const filtered = applyFilters(allNews);
      setNews(filtered);
    }
  }, [selectedFilter, searchQuery, searchActive, tabView, sortAscending, bookmarkedNews, deletedNotifications, readNotifications]);

  // Count unread notifications
  useEffect(() => {
    const count = news.filter(item => !readNotifications[item.id] && !deletedNotifications[item.id]).length;
    setUnreadCount(count);
  }, [news, deletedNotifications, readNotifications]);

  const loadNotificationStatus = async () => {
    const deleted = await notificationStorage.getDeletedNotifications();
    const read = await notificationStorage.getReadNotifications();
    setDeletedNotifications(deleted);
    setReadNotifications(read);
  };

  const loadBookmarks = async () => {
    const bookmarks = await bookmarkStorage.getBookmarks();
    setBookmarkedNews(bookmarks);
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the authenticated API client instead of direct fetch
      const data = await get(API.ENDPOINTS.STORED_NOTIFICATIONS);
      
      if (data.success) {
        setAllNews(data.notifications);
        
        // Also store locally for offline access
        await notificationStorage.saveAllNotifications(data.notifications);
        
        // Apply filters to the fresh data
        const filtered = applyFilters(data.notifications);
        setNews(filtered);
      } else {
        setError(data.message || 'Fehler beim Laden der Daten');
        
        // Try to load from local storage if API request fails
        const localNotifications = await notificationStorage.getAllNotifications();
        if (localNotifications.length > 0) {
          setAllNews(localNotifications);
          const filtered = applyFilters(localNotifications);
          setNews(filtered);
          setError("Offline-Modus. Letzte bekannte Daten werden angezeigt.");
        }
      }
    } catch (error) {
      setError(
        `Verbindungsfehler: ${error.message || 'Unbekannter Fehler'}`
      );
      console.error("Error fetching news:", error);
      
      // Try to load from local storage if network request fails
      const localNotifications = await notificationStorage.getAllNotifications();
      if (localNotifications.length > 0) {
        setAllNews(localNotifications);
        const filtered = applyFilters(localNotifications);
        setNews(filtered);
        setError("Offline-Modus. Letzte bekannte Daten werden angezeigt.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNews();
    } finally {
      setRefreshing(false);
    }
  };

  const handleBookmarkToggle = async (newsId) => {
    const newStatus = await bookmarkStorage.toggleBookmark(newsId);
    
    setBookmarkedNews(prev => ({
      ...prev,
      [newsId]: newStatus
    }));
  };

  const handleDeleteNotification = async (newsId) => {
    await notificationStorage.deleteNotification(newsId);
    setDeletedNotifications(prev => ({
      ...prev,
      [newsId]: true
    }));
  };

  const navigateToNewsDetail = async (newsItem) => {
    // Mark as read
    if (!readNotifications[newsItem.id]) {
      await notificationStorage.markAsRead(newsItem.id);
      setReadNotifications(prev => ({
        ...prev,
        [newsItem.id]: true
      }));
    }
    
    // Navigate to the NewsDetailScreen with the selected news item
    navigation.navigate("NewsDetail", { 
      newsItem: { 
        ...newsItem, 
        isRead: true 
      }
    });
  };

  const toggleFilter = (filter) => {
    if (selectedFilter === filter) {
      // If clicking the same filter, turn it off
      setSelectedFilter(null);
      setFilterActive(false);
    } else {
      // Otherwise, activate the filter
      setSelectedFilter(filter);
      setFilterActive(true);
    }
  };

  const toggleSearch = () => {
    setSearchActive(!searchActive);
    if (searchActive) {
      setSearchQuery('');
    }
  };

  const toggleSortOrder = () => {
    setSortAscending(prev => !prev);
  };

  const markAllAsRead = async () => {
    // Instead of only marking filtered news items as read, mark ALL unread notifications
    const unreadIds = allNews
      .filter(item => !readNotifications[item.id])
      .map(item => item.id);
      
    await notificationStorage.markAllAsRead(unreadIds);
    
    // Update local state
    const newReadState = { ...readNotifications };
    unreadIds.forEach(id => {
      newReadState[id] = true;
    });
    
    setReadNotifications(newReadState);
  };

  // Apply all active filters to the news array and sort
  const applyFilters = (newsArray) => {
    // Start with notifications filter
    let filteredNews = [...newsArray];
    
    // Filter out deleted notifications in the notifications tab
    if (tabView === 'notifications') {
      filteredNews = filteredNews.filter(item => !deletedNotifications[item.id]);
      // Also filter out read notifications when in notifications tab
      filteredNews = filteredNews.filter(item => !readNotifications[item.id]);
    }
    
    // Apply text search filter if active
    if (searchActive && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredNews = filteredNews.filter(item => 
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.aiSummary && item.aiSummary.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.affectedLaws && item.affectedLaws.some(law => 
          law.title && law.title.toLowerCase().includes(query)
        ))
      );
    }
    
    // Apply category/jurisdiction filter if selected
    if (selectedFilter) {
      if (selectedFilter === 'Bundesrecht') {
        filteredNews = filteredNews.filter(item => item.jurisdiction === 'BR');
      } else if (selectedFilter === 'Landesrecht') {
        filteredNews = filteredNews.filter(item => item.jurisdiction === 'LR');
      } else if (selectedFilter === 'bookmarks') {
        // Filter only bookmarked news
        filteredNews = filteredNews.filter(item => bookmarkedNews[item.id]);
      } else {
        filteredNews = filteredNews.filter(item => item.category === selectedFilter);
      }
    }
    
    // Sort by publication date
    filteredNews.sort((a, b) => {
      const dateA = new Date(a.publicationDate || 0);
      const dateB = new Date(b.publicationDate || 0);
      return sortAscending ? dateA - dateB : dateB - dateA;
    });
    
    return filteredNews;
  };

  const resetTestData = async () => {
    try {
      // Start with loading indicator
      setLoading(true);
      
      // Reset read status and deleted notifications for testing
      await notificationStorage.clearAllNotificationData();
      
      // Reset state
      setReadNotifications({});
      setDeletedNotifications({});
      
      // Fetch new data
      await fetchNews();
    } catch (error) {
      console.error("Error refreshing test data:", error);
      setError("Fehler beim Zurücksetzen der Testdaten");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2196F3" />
          <Text className="text-gray-500 mt-4">Rechtsnews werden geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        className="flex-1 bg-white"
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        {/* Header with search and options */}
        <NewsHeader 
          tabView={tabView}
          unreadCount={unreadCount}
          markAllAsRead={markAllAsRead}
          resetTestData={resetTestData}
          toggleSortOrder={toggleSortOrder}
          sortAscending={sortAscending}
          toggleSearch={toggleSearch}
          searchActive={searchActive}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        {/* Tab selector */}
        {!searchActive && (
          <NewsTabSelector 
            tabView={tabView}
            setTabView={setTabView}
            unreadCount={unreadCount}
          />
        )}

        {/* Filter chips */}
        {!searchActive && (
          <NewsFilters 
            selectedFilter={selectedFilter}
            filterActive={filterActive}
            toggleFilter={toggleFilter}
            setSelectedFilter={setSelectedFilter}
            setFilterActive={setFilterActive}
            bookmarkedNews={bookmarkedNews}
          />
        )}

        {/* News List */}
        {news.length > 0 ? (
          <FlatList
            data={news}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NewsCard
                item={item}
                onPress={() => navigateToNewsDetail(item)}
                isBookmarked={bookmarkedNews[item.id]}
                onBookmarkToggle={handleBookmarkToggle}
                showNotificationBadge={tabView === 'notifications' || !readNotifications[item.id]}
                onDelete={handleDeleteNotification}
                isInNotificationsTab={tabView === 'notifications'}
                isRead={readNotifications[item.id]}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#2196F3"]}
              />
            }
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        ) : (
          <EmptyNewsState 
            loading={loading} 
            error={error} 
            onRetry={fetchNews}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default LegalNewsScreen; 