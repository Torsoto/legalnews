import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API } from "../constants";
import * as bookmarkStorage from "../utils/bookmarkStorage";

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

const NewsCard = ({ item, onPress, isBookmarked, onBookmarkToggle, showNotificationBadge = false }) => {
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
    <TouchableOpacity 
      className="mb-4 mx-3 bg-white rounded-xl shadow-sm overflow-hidden"
      style={{ 
        elevation: 3,
        backgroundColor: !item.isRead && showNotificationBadge ? "#EBF5FF" : "white"
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
                {item.jurisdiction}
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
  );
};

const LegalNewsScreen = ({ navigation }) => {
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

  // Load bookmarks and news on mount
  useEffect(() => {
    loadBookmarks();
    fetchNews();

    // Add a listener for when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookmarks();
    });

    return unsubscribe;
  }, [navigation]);

  // Count unread notifications
  useEffect(() => {
    const count = news.filter(item => !item.isRead).length;
    setUnreadCount(count);
  }, [news]);

  const loadBookmarks = async () => {
    const bookmarks = await bookmarkStorage.getBookmarks();
    setBookmarkedNews(bookmarks);
  };

  const fetchNews = async () => {
    if (!refreshing) setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(SERVER_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Process and sort news by date (newest first)
      const processedNews = data.notifications.sort((a, b) => {
        const dateA = new Date(a.publicationDate || 0);
        const dateB = new Date(b.publicationDate || 0);
        return dateB - dateA;
      });

      setNews(processedNews);
    } catch (error) {
      console.error("Error fetching news:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
  };

  const handleBookmarkToggle = async (newsId) => {
    const newStatus = await bookmarkStorage.toggleBookmark(newsId);
    
    setBookmarkedNews(prev => ({
      ...prev,
      [newsId]: newStatus
    }));
  };

  const navigateToNewsDetail = (newsItem) => {
    // Mark as read
    if (!newsItem.isRead) {
      setNews(prev => prev.map(item => 
        item.id === newsItem.id ? { ...item, isRead: true } : item
      ));
    }
    // Navigate to the NewsDetailScreen with the selected news item
    navigation.navigate("NewsDetail", { newsItem: { ...newsItem, isRead: true }});
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

  const markAllAsRead = () => {
    setNews(prev => prev.map(item => ({ ...item, isRead: true })));
  };

  const getFilteredNews = () => {
    let filteredItems = news;
    
    // Apply tab filter
    if (tabView === 'notifications') {
      filteredItems = filteredItems.filter(item => !item.isRead);
    }
    
    // Apply other filters
    if (filterActive && selectedFilter) {
      filteredItems = filteredItems.filter(item => {
        if (selectedFilter === 'bookmark') {
          return bookmarkedNews[item.id];
        } else if (selectedFilter === 'federal') {
          return item.jurisdiction === 'Bundesrecht';
        } else if (selectedFilter === 'EU') {
          return item.jurisdiction === 'EU-Recht';
        } else if (selectedFilter === 'state') {
          return item.jurisdiction === 'Landesrecht';
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
        (item.jurisdiction && item.jurisdiction.toLowerCase().includes(query))
      );
    }
    
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
            selectedFilter === 'federal' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 border border-gray-200'
          }`}
          onPress={() => toggleFilter('federal')}
        >
          <Text className={`text-sm ${selectedFilter === 'federal' ? 'text-blue-800' : 'text-gray-700'}`}>
            Bundesrecht
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
            selectedFilter === 'state' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100 border border-gray-200'
          }`}
          onPress={() => toggleFilter('state')}
        >
          <Text className={`text-sm ${selectedFilter === 'state' ? 'text-blue-800' : 'text-gray-700'}`}>
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

  const filteredNews = getFilteredNews();

  return (
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
            {tabView === 'notifications' && unreadCount > 0 && (
              <TouchableOpacity 
                className="mr-4 p-2"
                onPress={markAllAsRead}
              >
                <Text className="text-primary text-sm font-medium">Alle gelesen</Text>
              </TouchableOpacity>
            )}
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
      {filteredNews.length > 0 ? (
        <FlatList
          data={filteredNews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NewsCard
              item={item}
              onPress={() => navigateToNewsDetail(item)}
              isBookmarked={bookmarkedNews[item.id]}
              onBookmarkToggle={handleBookmarkToggle}
              showNotificationBadge={tabView === 'notifications' || !item.isRead}
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
  );
};

export default LegalNewsScreen; 