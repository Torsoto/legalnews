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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NotificationCard from "../components/NotificationCard";
import * as bookmarkStorage from "../utils/bookmarkStorage";
import { API } from "../constants";

const EmptyBookmarks = () => (
  <View className="flex-1 items-center justify-center p-8">
    <View className="items-center">
      <Ionicons name="bookmark-outline" size={64} color="#ccc" />
      <Text className="text-gray-500 text-center mt-4 mb-2 text-lg font-medium">
        Keine Lesezeichen
      </Text>
      <Text className="text-gray-400 text-center mb-6">
        Sie haben noch keine Benachrichtigungen als Lesezeichen gespeichert.
      </Text>
    </View>
  </View>
);

const BookmarksScreen = ({ navigation }) => {
  const [bookmarkedNotifications, setBookmarkedNotifications] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState({});
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBookmarks();
    
    // Add a listener for when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookmarks();
    });

    return unsubscribe;
  }, [navigation]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      // First, get the bookmark IDs
      const bookmarks = await bookmarkStorage.getBookmarks();
      setBookmarkIds(bookmarks);
      
      if (Object.keys(bookmarks).length === 0) {
        setBookmarkedNotifications([]);
        setLoading(false);
        return;
      }
      
      // Then fetch all notifications to filter the bookmarked ones
      const response = await fetch(API.BASE_URL + API.ENDPOINTS.STORED_NOTIFICATIONS);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter only bookmarked notifications
      const bookmarkedItems = data.notifications.filter(
        notification => bookmarks[notification.id]
      );
      
      setBookmarkedNotifications(bookmarkedItems);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotificationExpand = (id) => {
    setExpandedNotificationId(expandedNotificationId === id ? null : id);
  };

  const handleBookmarkToggle = async (notificationId) => {
    // Toggle bookmark status
    await bookmarkStorage.toggleBookmark(notificationId);
    
    // Update UI
    const newBookmarks = { ...bookmarkIds };
    
    if (newBookmarks[notificationId]) {
      delete newBookmarks[notificationId];
      // Remove from display list
      setBookmarkedNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } else {
      newBookmarks[notificationId] = true;
    }
    
    setBookmarkIds(newBookmarks);
  };
  
  const clearAllBookmarks = () => {
    Alert.alert(
      "Alle Lesezeichen löschen",
      "Sind Sie sicher, dass Sie alle Lesezeichen löschen möchten?",
      [
        {
          text: "Abbrechen",
          style: "cancel"
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            await bookmarkStorage.clearAllBookmarks();
            setBookmarkIds({});
            setBookmarkedNotifications([]);
          }
        }
      ]
    );
  };

  const renderBookmarkedNotification = ({ item }) => (
    <NotificationCard
      notification={item}
      expandedNotificationId={expandedNotificationId}
      onToggleExpand={toggleNotificationExpand}
      onToggleBookmark={handleBookmarkToggle}
      isBookmarked={true}
    />
  );

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text className="text-gray-500 mt-4">Lesezeichen werden geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Header with actions */}
      <View className="bg-white border-b border-gray-200 pb-2">
        <View className="flex-row justify-between items-center pt-1 px-4">
          <View className="flex-row items-center">
            <Ionicons name="bookmark" size={24} color="#4CAF50" />
            <Text className="text-xl font-bold ml-2">Lesezeichen</Text>
          </View>
          
          {bookmarkedNotifications.length > 0 && (
            <TouchableOpacity
              onPress={clearAllBookmarks}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bookmarked notifications list */}
      <FlatList
        data={bookmarkedNotifications}
        renderItem={renderBookmarkedNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 24,
          flexGrow: bookmarkedNotifications.length === 0 ? 1 : undefined
        }}
        ListEmptyComponent={<EmptyBookmarks />}
      />
      
      {/* Back Button */}
      <View className="absolute bottom-4 right-4">
        <TouchableOpacity
          className="bg-primary w-12 h-12 rounded-full items-center justify-center shadow-md"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookmarksScreen; 