import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as bookmarkStorage from '../utils/bookmarkStorage';

const NotificationCard = ({ 
  notification, 
  expandedNotificationId, 
  onToggleExpand,
  onToggleBookmark,
  isBookmarked,
}) => {
  const [expandedArticles, setExpandedArticles] = useState({});
  const [expandedChanges, setExpandedChanges] = useState({});
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [articleChanges, setArticleChanges] = useState([]);
  const [ungroupedChanges, setUngroupedChanges] = useState([]);
  
  // Group changes by article when expanded
  useEffect(() => {
    if (expandedNotificationId === notification.id) {
      if (notification.articles && notification.articles.length > 0 && notification.changes) {
        groupChangesByArticle();
      } else if (notification.changes) {
        setUngroupedChanges(notification.changes);
      }
    }
  }, [expandedNotificationId, notification]);
  
  // Group changes by article based on the numbering
  const groupChangesByArticle = () => {
    const articleCount = notification.articles.length;
    const changeGroups = [];
    let currentGroup = [];
    let currentArticleIndex = 0;
    
    // Iterate through changes and group them
    notification.changes.forEach(change => {
      // If we find a change starting with "1.", it's the beginning of a new article's changes
      if (change.title.trim().startsWith("1.") && currentGroup.length > 0) {
        changeGroups.push([...currentGroup]);
        currentGroup = [];
        currentArticleIndex++;
      }
      
      // Add the change to current group if not exceeding article count
      if (currentArticleIndex < articleCount) {
        currentGroup.push(change);
      }
    });
    
    // Add the last group if not empty
    if (currentGroup.length > 0 && currentArticleIndex < articleCount) {
      changeGroups.push(currentGroup);
    }
    
    // Fill remaining articles with empty arrays if needed
    while (changeGroups.length < articleCount) {
      changeGroups.push([]);
    }
    
    setArticleChanges(changeGroups);
  };
  
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
  
  const toggleArticleExpand = (articleId) => {
    setExpandedArticles(prev => ({
      ...prev,
      [articleId]: !prev[articleId],
    }));
  };
  
  const toggleChangeExpand = (changeId) => {
    setExpandedChanges(prev => ({
      ...prev,
      [changeId]: !prev[changeId],
    }));
  };
  
  const formatDate = (dateString) => {
    if (!dateString || dateString === "undefined") return "Datum nicht verfügbar";
    try {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Date(dateString).toLocaleDateString("de-AT", options);
    } catch (error) {
      return dateString;
    }
  };
  
  const renderChange = (change) => {
    return (
      <View
        key={change.id}
        className="mb-4 pb-3 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
      >
        <View className="mb-2">
          <Text className="text-gray-900 font-medium mb-2">{change.title}</Text>
          
          {change.change && change.change.trim() !== "" && (
            <TouchableOpacity 
              onPress={() => toggleChangeExpand(change.id)}
              activeOpacity={0.7}
            >
              <View className={`bg-gray-100 px-3 py-2 rounded border-l-4 border-primary mt-2`}>
                <Text 
                  className="text-gray-800" 
                  numberOfLines={expandedChanges[change.id] ? undefined : 3}
                >
                  {change.change}
                </Text>
                {change.change.length > 150 && (
                  <Text className="text-primary text-xs mt-1">
                    {expandedChanges[change.id] ? "Weniger anzeigen" : "Mehr anzeigen"}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  const isExpanded = expandedNotificationId === notification.id;
  
  return (
    <View
      className={`mb-4 rounded-xl shadow-sm overflow-hidden ${
        notification.isRead ? 'border border-gray-200' : 'border-2 border-primary'
      }`}
      style={{ elevation: isExpanded ? 3 : 1 }}
    >
      <TouchableOpacity
        className={`p-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
        onPress={() => onToggleExpand(notification.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center flex-1">
            {!notification.isRead && (
              <View className="bg-primary h-3 w-3 rounded-full mr-2 mt-1.5" />
            )}
            <View className="flex-1">
              <Text className={`text-lg font-bold mb-1 ${notification.isRead ? 'text-gray-800' : 'text-black'}`}>
                {notification.title}
              </Text>
              <TouchableOpacity
                onPress={() => setExpandedDescription(!expandedDescription)}
                activeOpacity={0.7}
                className="mt-1"
              >
                <Text
                  className={`text-gray-700 ${!expandedDescription ? 'line-clamp-2' : ''}`}
                  numberOfLines={expandedDescription ? undefined : 2}
                >
                  {notification.description}
                </Text>
                {notification.description?.length > 100 && (
                  <Text className="text-primary text-xs mt-1">
                    {expandedDescription ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center ml-2">
            <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
              <TouchableOpacity
                onPress={() => onToggleBookmark(notification.id)}
                className="mr-3 p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={isBookmarked ? '#4CAF50' : '#666'}
                />
              </TouchableOpacity>
            </Animated.View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#2196F3"
            />
          </View>
        </View>

        <View className="flex-row flex-wrap mt-3">
          {notification.category && (
            <View className="bg-blue-50 px-3 py-1 rounded-full mr-2 mb-1 border border-blue-100">
              <Text className="text-xs text-blue-700 font-medium">
                {notification.category}
              </Text>
            </View>
          )}
          {notification.jurisdiction && (
            <View className="bg-green-50 px-3 py-1 rounded-full mr-2 mb-1 border border-green-100">
              <Text className="text-xs text-green-700 font-medium">
                {notification.jurisdiction}
              </Text>
            </View>
          )}
          <View className="bg-gray-100 px-3 py-1 rounded-full mb-1 border border-gray-200">
            <Text className="text-xs text-gray-700 font-medium">
              {formatDate(notification.publicationDate)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
          {/* AI Summary Section */}
          {notification.aiSummary && (
            <View className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="sparkles" size={18} color="#2196F3" />
                <Text className="text-blue-700 font-bold ml-1">KI-Zusammenfassung</Text>
              </View>

              <TouchableOpacity
                onPress={() => setExpandedSummary(!expandedSummary)}
                activeOpacity={0.7}
              >
                <Text
                  className="text-gray-700"
                  numberOfLines={expandedSummary ? undefined : 3}
                >
                  {notification.aiSummary}
                </Text>
                {notification.aiSummary.length > 150 && (
                  <Text className="text-primary text-sm mt-1">
                    {expandedSummary ? "Weniger anzeigen" : "Mehr anzeigen"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Articles with their changes */}
          {notification.articles && notification.articles.length > 0 ? (
            <View>
              {notification.articles.map((article, index) => (
                <View
                  key={article.id}
                  className="mb-3 border border-gray-200 rounded-lg overflow-hidden"
                >
                  <TouchableOpacity
                    className="p-3 bg-white flex-row justify-between items-center"
                    onPress={() => toggleArticleExpand(article.id)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="font-bold text-gray-800">
                        {article.title}
                      </Text>
                      {article.subtitle && (
                        <Text className="text-gray-600 mt-1" numberOfLines={1}>
                          {article.subtitle}
                        </Text>
                      )}
                    </View>
                    <Ionicons 
                      name={expandedArticles[article.id] ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>

                  {/* Display article changes when expanded */}
                  {expandedArticles[article.id] && (
                    <View className="p-3 bg-gray-50 border-t border-gray-200">
                      {article.subtitle && (
                        <Text className="text-gray-800 mb-3">
                          {article.subtitle}
                        </Text>
                      )}
                      
                      {articleChanges[index] && articleChanges[index].length > 0 ? (
                        <View>
                          <Text className="font-bold text-gray-800 mb-2">Änderungen:</Text>
                          {articleChanges[index].map(renderChange)}
                        </View>
                      ) : (
                        <View className="py-2">
                          <Text className="text-gray-500 italic text-center">
                            Keine Änderungen für diesen Artikel
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            /* Standalone changes when no articles are present */
            ungroupedChanges.length > 0 && (
              <View>
                <Text className="font-bold text-gray-700 mb-2">Änderungen:</Text>
                {ungroupedChanges.map(renderChange)}
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
};

export default NotificationCard; 