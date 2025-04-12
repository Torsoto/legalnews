import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Share,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as bookmarkStorage from "../utils/bookmarkStorage";

const formatDate = (dateString) => {
  if (!dateString || dateString === "undefined") return "Datum nicht verfügbar";
  try {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("de-AT", options);
  } catch (error) {
    return dateString;
  }
};

const ChangeItem = ({ change }) => {
  // Extract the paragraph number from the instruction
  const paragraphMatch = change.instruction.match(/§\s*\d+[a-z]*(?:\s*Abs\.\s*\d+)?/);
  const paragraph = paragraphMatch ? paragraphMatch[0] : "";

  return (
    <View className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
      {paragraph && (
        <View className="bg-gray-200 px-3 py-1.5 rounded mb-2 self-start">
          <Text className="text-black font-medium">{paragraph}</Text>
        </View>
      )}

      <View className="mb-2">
        <Text className="text-gray-900 mb-2">{change.instruction}</Text>

        {change.newText && change.newText.trim() !== "" && (
          <View className="bg-gray-100 px-3 py-2 rounded border-l-4 border-primary mt-2">
            <Text className="text-gray-800">{change.newText}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const ArticleSection = ({ article }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <TouchableOpacity
        className="p-4 bg-white flex-row justify-between items-center"
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View className="flex-1 pr-3">
          <Text className="font-bold text-gray-800">
            {article.subtitle || article.title}
          </Text>
        </View>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>

      {expanded && (
        <View className="p-4 bg-gray-50 border-t border-gray-200">
          {article.changes && article.changes.length > 0 ? (
            article.changes.map((change) => (
              <ChangeItem key={change.id} change={change} />
            ))
          ) : (
            <View className="py-2">
              <Text className="text-gray-500 italic text-center">
                Keine Änderungen vorhanden
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const NewsDetailScreen = ({ route, navigation }) => {
  const { newsItem } = route.params;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [scaleAnimation] = useState(new Animated.Value(1));

  const checkIfBookmarked = async () => {
    const bookmarks = await bookmarkStorage.getBookmarks();
    setIsBookmarked(bookmarks[newsItem.id] || false);
  };

  useEffect(() => {
    checkIfBookmarked();
  }, [newsItem]);

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

  const handleBookmarkToggle = async () => {
    const newStatus = await bookmarkStorage.toggleBookmark(newsItem.id);
    setIsBookmarked(newStatus);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${newsItem.title} - ${newsItem.description || ''}\n\nÄnderungen in der Gesetzgebung vom ${formatDate(newsItem.publicationDate)}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleOpenOriginalDocument = () => {
    // This would open the original document URL if it exists
    if (newsItem.documentUrl) {
      Linking.openURL(newsItem.documentUrl);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Header */}
      <View className="bg-white shadow-sm border-b border-gray-100 py-3 px-4">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#2196F3" />
          </TouchableOpacity>
          
          <Text className="flex-1 text-center text-lg font-semibold text-gray-800" numberOfLines={1}>
            {newsItem.title.length > 30 ? newsItem.title.substring(0, 30) + '...' : newsItem.title}
          </Text>
          
          <View className="flex-row items-center">
            <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
              <TouchableOpacity
                onPress={handleBookmarkToggle}
                className="p-1 mx-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={22} 
                  color={isBookmarked ? "#4CAF50" : "#666"}
                />
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity
              onPress={handleShare}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-outline" size={22} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Title and metadata */}
        <View className="p-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-800 mb-3">
            {newsItem.title}
          </Text>
          
          <View className="flex-row flex-wrap mb-3">
            {newsItem.category && (
              <View className="bg-blue-50 px-3 py-1 rounded-full mr-2 mb-1 border border-blue-100">
                <Text className="text-xs text-blue-700 font-medium">
                  {newsItem.category}
                </Text>
              </View>
            )}
            {newsItem.jurisdiction && (
              <View className="bg-green-50 px-3 py-1 rounded-full mr-2 mb-1 border border-green-100">
                <Text className="text-xs text-green-700 font-medium">
                  {newsItem.jurisdiction}
                </Text>
              </View>
            )}
            <View className="bg-gray-100 px-3 py-1 rounded-full mb-1 border border-gray-200">
              <Text className="text-xs text-gray-700 font-medium">
                {formatDate(newsItem.publicationDate)}
              </Text>
            </View>
          </View>
          
          <Text className="text-gray-600 mb-4">
            {newsItem.description}
          </Text>
          
          {newsItem.documentUrl && (
            <TouchableOpacity
              onPress={handleOpenOriginalDocument}
              className="flex-row items-center"
            >
              <Ionicons name="document-text-outline" size={16} color="#2196F3" />
              <Text className="text-primary ml-1 underline">
                Originaldokument anzeigen
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* AI Summary if available */}
        {newsItem.aiSummary && (
          <View className="p-4 border-b border-gray-200">
            <View className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="sparkles" size={18} color="#2196F3" />
                <Text className="text-blue-700 font-bold ml-1">KI-Zusammenfassung</Text>
              </View>
              <Text className="text-gray-700">
                {newsItem.aiSummary}
              </Text>
            </View>
          </View>
        )}
        
        {/* Articles and changes */}
        <View className="p-4">
          <Text className="font-bold text-lg text-gray-800 mb-3">
            Änderungen im Detail
          </Text>
          
          {newsItem.articles && newsItem.articles.length > 0 ? (
            newsItem.articles.map((article) => (
              <ArticleSection key={article.id} article={article} />
            ))
          ) : (
            <View className="py-4 items-center">
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text className="text-gray-500 mt-2 text-center">
                Keine detaillierten Änderungen verfügbar
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NewsDetailScreen; 