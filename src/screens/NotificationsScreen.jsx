import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.0.136:3000/api/notifications';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [expandedArticles, setExpandedArticles] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [bookmarkedNotifications, setBookmarkedNotifications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(SERVER_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Process notifications to fix the articles and changes
      const processedNotifications = data.notifications.map(notification => {
        // Skip if there are no articles
        if (!notification.articles || notification.articles.length <= 1) {
          return notification;
        }
        
        // In the API response, all changes are in the last article
        const lastArticle = notification.articles[notification.articles.length - 1];
        const allChanges = [...(lastArticle?.changes || [])];
        const lawText = lastArticle?.law || '';
        
        // If there are no changes to redistribute, return as is
        if (allChanges.length === 0) {
          return notification;
        }
        
        // Create a new array of articles
        const processedArticles = notification.articles.map((article, index) => {
          // Skip the last article as we'll rebuild it
          if (index === notification.articles.length - 1) {
            return {
              ...article,
              law: '', // Clear law from last article
              changes: [] // Clear changes from last article
            };
          }
          
          // Other articles will be updated later
          return {
            ...article,
            law: '',
            changes: []
          };
        });
        
        // Set the law text on the first article
        if (processedArticles.length > 0 && lawText) {
          processedArticles[0].law = lawText;
        }
        
        // Group changes by the numbering pattern
        let articleIndex = 0;
        let currentGroup = [];
        const groupedChanges = [];
        
        allChanges.forEach((change, index) => {
          // Check if instruction starts with "1." which indicates a new set
          if (/^1[.)]\s/.test(change.instruction) && index > 0) {
            // Save the current group
            groupedChanges.push([...currentGroup]);
            currentGroup = []; // Reset for new group
          }
          
          // Add to current group
          currentGroup.push(change);
        });
        
        // Don't forget to add the last group
        if (currentGroup.length > 0) {
          groupedChanges.push([...currentGroup]);
        }
        
        // Distribute grouped changes to articles
        groupedChanges.forEach((group, index) => {
          // Make sure we don't go beyond available articles
          if (index < processedArticles.length) {
            processedArticles[index].changes = group;
          }
        });
        
        return {
          ...notification,
          articles: processedArticles
        };
      });
      
      setNotifications(processedNotifications);
    } catch (error) {
      console.error('Error fetching or processing notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const toggleNotificationExpand = (id) => {
    setExpandedNotification(expandedNotification === id ? null : id);
  };

  const toggleArticleExpand = (articleId) => {
    setExpandedArticles(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  const toggleDescriptionExpand = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleBookmark = (id) => {
    setBookmarkedNotifications(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'undefined') return 'Datum nicht verfügbar';
    try {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-AT', options);
    } catch (error) {
      return dateString;
    }
  };

  const renderChange = (change) => {
    // Extract the paragraph number from the instruction
    const paragraphMatch = change.instruction.match(/§\s*\d+[a-z]*(?:\s*Abs\.\s*\d+)?/);
    const paragraph = paragraphMatch ? paragraphMatch[0] : '';

    return (
      <View key={change.id} className="mb-4 pb-3 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
        <View className="bg-gray-200 px-3 py-1.5 rounded mb-2">
          <Text className="text-black font-medium">{paragraph}</Text>
        </View>
        
        <View className="mb-2">
          <Text className="text-gray-900 mb-1">{change.instruction}</Text>
          
          {change.newText && change.newText.trim() !== '' && (
            <View className="bg-gray-100 px-3 py-2 rounded border-l-4 border-primary mt-2">
              <Text className="text-gray-800 italic">"{change.newText}"</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <View className="flex-1 p-5 items-center justify-center">
          <Text className="text-red-500 mb-4">Fehler beim Laden der Benachrichtigungen</Text>
          <Text className="text-gray-500 text-center">{error}</Text>
          <TouchableOpacity 
            className="mt-4 bg-primary px-4 py-2 rounded-lg"
            onPress={fetchNotifications}
          >
            <Text className="text-white">Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-200">
        <Text className="text-xl font-bold">Bundesgesetzblätter</Text>
        <TouchableOpacity 
          onPress={markAllAsRead}
          className="bg-primary px-3 py-1 rounded-lg"
        >
          <Text className="text-white">Alle gelesen</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {notifications.length === 0 ? (
          <View className="py-10 items-center">
            <Text className="text-gray-500">Keine Benachrichtigungen vorhanden</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View
              key={notification.id}
              className={`mb-4 rounded-xl border overflow-hidden ${notification.isRead ? 'border-gray-200' : 'border-primary'}`}
            >
              <TouchableOpacity
                className={`p-4 ${notification.isRead ? 'bg-gray-50' : 'bg-white'}`}
                onPress={() => toggleNotificationExpand(notification.id)}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center flex-1">
                    {!notification.isRead && (
                      <View className="bg-primary h-3 w-3 rounded-full mr-2 mt-1.5" />
                    )}
                    <View className="flex-1">
                      <Text className={`text-lg font-bold ${notification.isRead ? 'text-gray-700' : 'text-black'}`}>
                        {notification.title}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => toggleDescriptionExpand(notification.id)}
                        className="mt-1"
                      >
                        <Text 
                          className={`text-gray-600 font-medium ${!expandedDescriptions[notification.id] ? 'line-clamp-2' : ''}`}
                          numberOfLines={expandedDescriptions[notification.id] ? undefined : 2}
                        >
                        {notification.description}
                      </Text>
                        {notification.description.length > 100 && (
                          <Text className="text-primary text-sm mt-1">
                            {expandedDescriptions[notification.id] ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center ml-2">
                    <TouchableOpacity 
                      onPress={() => toggleBookmark(notification.id)}
                      className="mr-2"
                    >
                      <Ionicons 
                        name={bookmarkedNotifications[notification.id] ? "bookmark" : "bookmark-outline"} 
                        size={24} 
                        color={bookmarkedNotifications[notification.id] ? "#2196F3" : "#2196F3"} 
                      />
                    </TouchableOpacity>
                    {!notification.isRead && (
                      <View className="bg-primary py-1 px-2 rounded mr-2">
                        <Text className="text-white text-xs">Neu</Text>
                      </View>
                    )}
                    <Text className="text-primary text-xl">
                      {expandedNotification === notification.id ? '▼' : '▶'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-2">
                  <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                    <Text className="text-xs text-gray-600">{notification.category}</Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                    <Text className="text-xs text-gray-600">{notification.jurisdiction}</Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-full">
                    <Text className="text-xs text-gray-600">
                      Veröffentlicht: {formatDate(notification.publicationDate)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {expandedNotification === notification.id && (
                <View className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                  {notification.articles.map((article) => (
                    <View key={article.id} className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                      <TouchableOpacity
                        className="p-3 bg-white flex-row justify-between items-center"
                        onPress={() => toggleArticleExpand(article.id)}
                      >
                        <View>
                          <Text className="font-bold text-base">
                          {article.subtitle}
                          </Text>
                        </View>
                        <Text className="text-primary">
                          {expandedArticles[article.id] ? '▼' : '▶'}
                        </Text>
                      </TouchableOpacity>
                      
                      {expandedArticles[article.id] && (
                        <View className="p-3 bg-gray-50 border-t border-gray-200">
                          {article.changes.map(renderChange)}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen; 