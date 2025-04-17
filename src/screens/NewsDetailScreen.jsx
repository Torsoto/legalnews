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
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
      <View className="mb-2">
        <Text className="text-gray-900 font-medium mb-2">{change.title}</Text>

        {change.change && change.change.trim() !== "" && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <View className="bg-gray-100 px-3 py-2 rounded border-l-4 border-primary mt-2">
              <Text
                className="text-gray-800"
                numberOfLines={expanded ? undefined : 3}
              >
                {change.change}
              </Text>
              {change.change.length > 150 && (
                <Text className="text-primary text-xs mt-1">
                  {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ArticleSection = ({ article, changes }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <TouchableOpacity
        className="p-4 bg-white flex-row justify-between items-center"
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View className="flex-1 pr-3">
          <Text className="font-bold text-gray-800">{article.title}</Text>
          {article.subtitle && !expanded && (
            <Text className="text-gray-600 mt-1" numberOfLines={1}>
              {article.subtitle}
            </Text>
          )}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {expanded && (
        <View className="p-4 bg-gray-50 border-t border-gray-200">
          {article.subtitle && (
            <Text className="text-gray-800 mb-4">{article.subtitle}</Text>
          )}

          {/* Show changes for this article */}
          {changes && changes.length > 0 ? (
            <View>
              <Text className="font-bold text-gray-800 mb-3">Änderungen:</Text>
              {changes.map((change) => (
                <ChangeItem key={change.id} change={change} />
              ))}
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
  );
};

const NewsDetailScreen = ({ route, navigation }) => {
  const { newsItem } = route.params;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [articleChanges, setArticleChanges] = useState([]);
  const [ungroupedChanges, setUngroupedChanges] = useState([]);

  const checkIfBookmarked = async () => {
    const bookmarks = await bookmarkStorage.getBookmarks();
    setIsBookmarked(bookmarks[newsItem.id] || false);
  };

  useEffect(() => {
    checkIfBookmarked();

    // Group changes by article
    if (newsItem.articles && newsItem.articles.length > 0 && newsItem.changes) {
      groupChangesByArticle();
    } else if (newsItem.changes) {
      setUngroupedChanges(newsItem.changes);
    }
  }, [newsItem]);

  // Group changes by article based on the numbering
  const groupChangesByArticle = () => {
    const articleCount = newsItem.articles.length;
    const changeGroups = [];
    let currentGroup = [];
    let currentArticleIndex = 0;

    // Iterate through changes and group them
    newsItem.changes.forEach((change) => {
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
        message: `${newsItem.title} - ${
          newsItem.description || ""
        }\n\nÄnderungen in der Gesetzgebung vom ${formatDate(
          newsItem.publicationDate
        )}`,
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
            className="p-1 flex-row items-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#2196F3" />
            <Text className="text-primary ml-1 text-sm">Zurück</Text>
          </TouchableOpacity>

          <Text
            className="flex-1 text-center text-lg font-semibold text-gray-800"
            numberOfLines={1}
          >
            {newsItem.title.length > 25
              ? newsItem.title.substring(0, 25) + "..."
              : newsItem.title}
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
                  {newsItem.jurisdiction === "BR"
                    ? "Bundesrecht"
                    : newsItem.jurisdiction === "LR"
                    ? "Landesrecht"
                    : newsItem.jurisdiction === "EU"
                    ? "EU-Recht"
                    : newsItem.jurisdiction}
                </Text>
              </View>
            )}
            {newsItem.jurisdiction === "LR" && newsItem.bundesland && (
              <View className="bg-purple-50 px-3 py-1 rounded-full mr-2 mb-1 border border-purple-100">
                <Text className="text-xs text-purple-700 font-medium">
                  {newsItem.bundesland}
                </Text>
              </View>
            )}
            <View className="bg-gray-100 px-3 py-1 rounded-full mb-1 border border-gray-200">
              <Text className="text-xs text-gray-700 font-medium">
                {formatDate(newsItem.publicationDate)}
              </Text>
            </View>
          </View>

          <Text className="text-gray-600 mb-4">{newsItem.description}</Text>

          {newsItem.documentUrl && (
            <TouchableOpacity
              onPress={handleOpenOriginalDocument}
              className="flex-row items-center"
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#2196F3"
              />
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
                <Text className="text-blue-700 font-bold ml-1">
                  KI-Zusammenfassung
                </Text>
              </View>
              <Text className="text-gray-700">{newsItem.aiSummary}</Text>
            </View>
          </View>
        )}

        {/* Consolidated Version Links Section */}
        {newsItem.affectedLaws && newsItem.affectedLaws.length > 0 && (
          <View className="p-4 border-b border-gray-200">
            <View className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <View className="flex-row items-center mb-3">
                <Ionicons name="link" size={18} color="#2196F3" />
                <Text className="text-blue-700 font-bold ml-1">
                  Konsolidierte Fassungen
                </Text>
              </View>

              {newsItem.affectedLaws.map((law, index) => (
                <View key={index} className="mb-3 last:mb-0">
                  <Text className="text-gray-800 font-medium mb-1">
                    {law.title}
                  </Text>

                  {law.consolidatedVersionUrl ? (
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(law.consolidatedVersionUrl)
                      }
                      className="flex-row items-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color="#2196F3"
                      />
                      <Text className="text-primary ml-1 underline">
                        Konsolidierte Fassung anzeigen
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text className="text-gray-500 italic">
                      Keine konsolidierte Fassung verfügbar
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Articles with their changes */}
        {newsItem.articles && newsItem.articles.length > 0 && (
          <View className="p-4">
            {newsItem.articles.map((article, index) => (
              <ArticleSection
                key={article.id}
                article={article}
                changes={articleChanges[index] || []}
              />
            ))}
          </View>
        )}

        {/* Standalone changes when no articles are present */}
        {(!newsItem.articles || newsItem.articles.length === 0) &&
          ungroupedChanges.length > 0 && (
            <View className="p-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">
                Änderungen
              </Text>
              {ungroupedChanges.map((change) => (
                <ChangeItem key={change.id} change={change} />
              ))}
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NewsDetailScreen;
