import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Image,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API } from "../constants";
import * as bookmarkStorage from "../utils/bookmarkStorage";
import * as notificationStorage from "../utils/notificationStorage";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import { get } from "../utils/apiClient"; // Import the authenticated API client

// Use the stored-notifications endpoint for fetching news
const SERVER_URL = API.BASE_URL + API.ENDPOINTS.STORED_NOTIFICATIONS;

const EmptyNewsState = ({ loading, error, onRetry }) => (
  <View className="flex-1 items-center justify-center p-8">
    {!error ? (
      <View className="items-center">
        <Ionicons name="newspaper-outline" size={64} color="#ccc" />
        <Text className="text-gray-500 text-center mt-4 mb-2 text-lg font-medium">
          Keine Rechtsnews
        </Text>
        <Text className="text-gray-400 text-center mb-6">
          Derzeit sind keine aktuellen Rechtsnews verfügbar.
        </Text>
      </View>
    ) : (
      <View className="items-center">
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text className="text-red-500 text-center mt-4 mb-2 text-lg font-medium">
          Fehler beim Laden
        </Text>
        <Text className="text-gray-600 text-center mb-6">{error}</Text>
        <TouchableOpacity
          className="bg-primary px-5 py-2 rounded-lg"
          onPress={onRetry}
        >
          <Text className="text-white font-medium">Erneut versuchen</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const NewsCard = ({ item, onPress, isBookmarked, onBookmarkToggle, showNotificationBadge = false, onDelete, isInNotificationsTab, isRead }) => {
  const [scaleAnimation] = useState(new Animated.Value(1));
  
  // Animation when bookmarking
  useEffect(() => {
    if (isBookmarked) {
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isBookmarked]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "undefined") return "Datum nicht verfügbar";
    try {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Date(dateString).toLocaleDateString("de-AT", options);
    } catch (error) {
      return dateString;
    }
  };

  return (
    <View className="mx-3">
      <TouchableOpacity 
        className="mb-4 bg-white shadow-sm overflow-hidden"
        style={{ 
          elevation: 3,
          backgroundColor: !isRead && showNotificationBadge && isInNotificationsTab ? "#EBF5FF" : "white"
        }}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Card Header */}
        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-gray-800 mb-2">
                {item.title}
              </Text>
              <Text 
                className="text-gray-600"
                numberOfLines={2}
              >
                {item.description}
              </Text>
            </View>
            <View className="flex-row items-center">
              {/* Delete button - only shown in notifications tab */}
              {isInNotificationsTab && (
                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  className="p-1 mr-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color="#FF4136"
                  />
                </TouchableOpacity>
              )}
              {/* Bookmark button */}
              <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
                <TouchableOpacity
                  onPress={() => onBookmarkToggle(item.id)}
                  className="p-1"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={isBookmarked ? '#4CAF50' : '#666'}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
          
          {/* Tags and Date */}
          <View className="flex-row flex-wrap mt-3">
            {item.category && (
              <View className="bg-blue-50 px-3 py-1 rounded-full mr-2 mb-1 border border-blue-100">
                <Text className="text-xs text-blue-700 font-medium">
                  {item.category}
                </Text>
              </View>
            )}
            {item.jurisdiction && (
              <View className="bg-green-50 px-3 py-1 rounded-full mr-2 mb-1 border border-green-100">
                <Text className="text-xs text-green-700 font-medium">
                  {item.jurisdiction === 'BR' ? 'Bundesrecht' : 
                  item.jurisdiction === 'LR' ? 'Landesrecht' : 
                  item.jurisdiction === 'EU' ? 'EU-Recht' : item.jurisdiction}
                </Text>
              </View>
            )}
            {item.jurisdiction === 'LR' && item.bundesland && (
              <View className="bg-purple-50 px-3 py-1 rounded-full mr-2 mb-1 border border-purple-100">
                <Text className="text-xs text-purple-700 font-medium">
                  {item.bundesland}
                </Text>
              </View>
            )}
            <View className="bg-gray-100 px-3 py-1 rounded-full mb-1 border border-gray-200">
              <Text className="text-xs text-gray-700 font-medium">
                {formatDate(item.publicationDate)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Card Footer with preview indicator */}
        <View className="bg-gray-50 py-2 px-4 border-t border-gray-200 flex-row justify-between items-center">
          <Text className="text-sm text-primary font-medium">Mehr anzeigen</Text>
          <Ionicons name="chevron-forward" size={16} color="#2196F3" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

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
      setSelectedFilter(null);
      setFilterActive(false);
    } else {
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
    const unreadIds = news
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
    let filteredItems = [...newsArray];
    
    // Apply tab filter
    if (tabView === 'notifications') {
      // For notifications tab, show only unread AND not deleted
      filteredItems = filteredItems.filter(item => 
        !readNotifications[item.id] && !deletedNotifications[item.id]
      );
    } 
    // We don't filter out deleted items in "all" tab
    
    // Apply other filters
    if (filterActive && selectedFilter) {
      filteredItems = filteredItems.filter(item => {
        if (selectedFilter === 'bookmark') {
          return bookmarkedNews[item.id];
        } else if (selectedFilter === 'BR') {
          return item.jurisdiction === 'BR';
        } else if (selectedFilter === 'EU') {
          return item.jurisdiction === 'EU';
        } else if (selectedFilter === 'LR') {
          return item.jurisdiction === 'LR';
        }
        return true;
      });
    }
    
    // Apply search filter
    if (searchActive && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.jurisdiction && item.jurisdiction.toLowerCase().includes(query)) ||
        (item.bundesland && item.bundesland.toLowerCase().includes(query))
      );
    }
    
    // Sort by date
    filteredItems.sort((a, b) => {
      const dateA = new Date(a.publicationDate || 0);
      const dateB = new Date(b.publicationDate || 0);
      return sortAscending ? dateA - dateB : dateB - dateA;
    });
    
    return filteredItems;
  };

  const renderFilterChips = () => (
    <View className="mb-4 mt-2 px-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
        <TouchableOpacity
          className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
            selectedFilter === 'bookmark' ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-200'
          }`}
          onPress={() => toggleFilter('bookmark')}
        >
          <Ionicons
            name="bookmark"
            size={16}
            color={selectedFilter === 'bookmark' ? '#4CAF50' : '#666'}
            className="mr-1"
          />
          <Text className={`text-sm ${selectedFilter === 'bookmark' ? 'text-green-800' : 'text-gray-700'}`}>
            Lesezeichen
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
            selectedFilter === 'BR' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 border border-gray-200'
          }`}
          onPress={() => toggleFilter('BR')}
        >
          <Text className={`text-sm ${selectedFilter === 'BR' ? 'text-blue-800' : 'text-gray-700'}`}>
            Bundesrecht
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
            selectedFilter === 'LR' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 border border-gray-200'
          }`}
          onPress={() => toggleFilter('LR')}
        >
          <Text className={`text-sm ${selectedFilter === 'LR' ? 'text-blue-800' : 'text-gray-700'}`}>
            Landesrecht
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
            selectedFilter === 'EU' ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-100 border border-gray-200'
          }`}
          onPress={() => toggleFilter('EU')}
        >
          <Text className={`text-sm ${selectedFilter === 'EU' ? 'text-yellow-800' : 'text-gray-700'}`}>
            EU-Recht
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSearchBar = () => (
    <View className="px-3 pb-2">
      <View className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg">
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          className="flex-1 ml-2 text-base"
          placeholder="Suchen..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderTabSelector = () => (
    <View className="flex-row border-b border-gray-200 mb-2">
      <TouchableOpacity 
        className={`flex-1 py-3 ${tabView === 'all' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setTabView('all')}
      >
        <Text 
          className={`text-center font-medium ${tabView === 'all' ? 'text-primary' : 'text-gray-600'}`}
        >
          Alle News
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        className={`flex-1 py-3 flex-row justify-center items-center ${tabView === 'notifications' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setTabView('notifications')}
      >
        <Text 
          className={`text-center font-medium ${tabView === 'notifications' ? 'text-primary' : 'text-gray-600'}`}
        >
          Benachrichtigungen
        </Text>
        {unreadCount > 0 && (
          <View className="ml-1 bg-red-500 w-5 h-5 rounded-full justify-center items-center">
            <Text className="text-white text-xs font-bold">{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

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
        {/* Header with title */}
        <View className="bg-white shadow-sm border-b border-gray-100">
          <View className="flex-row justify-between items-center pt-2 pb-3 px-4">
            <Text className="text-xl font-bold text-gray-800">Rechtsnews</Text>
            <View className="flex-row">
              {tabView === 'notifications' && (
                <>
                  {unreadCount > 0 && (
                    <TouchableOpacity 
                      className="mr-4 p-2"
                      onPress={markAllAsRead}
                    >
                      <Text className="text-primary text-sm font-medium">Alle gelesen</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    className="mr-4 p-2 bg-blue-100 rounded-lg"
                    onPress={async () => {
                      try {
                        // Start with loading indicator
                        setLoading(true);
                        
                        // Reset read status and deleted notifications for testing
                        await notificationStorage.clearAllNotificationData();
                        
                        // Reset state
                        setReadNotifications({});
                        setDeletedNotifications({});
                        
                        // Fetch new data - this internally sets news state after applying filters
                        await fetchNews();
                        
                        // No need to manually filter again as fetchNews already does this
                      } catch (error) {
                        console.error("Error refreshing test data:", error);
                        setError("Fehler beim Zurücksetzen der Testdaten");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Text className="text-primary text-sm font-medium">Test Refresh</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity 
                onPress={toggleSortOrder}
                className="p-2 mr-1"
              >
                <Ionicons 
                  name={sortAscending ? "arrow-up" : "arrow-down"} 
                  size={22} 
                  color="#2196F3" 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={toggleSearch}
                className="p-2"
              >
                <Ionicons name={searchActive ? "close" : "search-outline"} size={22} color="#2196F3" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Search bar */}
          {searchActive && renderSearchBar()}
          
          {/* Tab selector */}
          {!searchActive && renderTabSelector()}
        </View>

        {/* Filter chips */}
        {!searchActive && renderFilterChips()}

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