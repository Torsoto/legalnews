import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Update to use the stored-notifications endpoint
const SERVER_URL = "http://192.168.0.136:3001/api/stored-notifications";

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [expandedArticles, setExpandedArticles] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [expandedSummaries, setExpandedSummaries] = useState({});
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

      // Process notifications to distribute changes to articles
      const processedNotifications = data.notifications.map((notification) => {
        // If there are no changes or no articles, return as is
        if (
          !notification.changes ||
          notification.changes.length === 0 ||
          !notification.articles ||
          notification.articles.length === 0
        ) {
          return notification;
        }

        // Make a deep copy of notification
        const processedNotification = { ...notification };

        // Add changes array to each article
        processedNotification.articles = notification.articles.map(
          (article) => ({
            ...article,
            changes: [],
          })
        );

        // Distribute changes to articles - group by "1." patterns
        let articleIndex = 0;
        let currentChanges = [];

        notification.changes.forEach((change, index) => {
          // If we encounter a change that starts with "1.",
          // and it's not the first change, move to next article
          if (change.instruction.trim().startsWith("1.") && index > 0) {
            // Assign current batch of changes to the current article
            if (
              articleIndex < processedNotification.articles.length &&
              currentChanges.length > 0
            ) {
              processedNotification.articles[articleIndex].changes = [
                ...currentChanges,
              ];
              // Reset current changes and move to next article
              currentChanges = [];
              articleIndex++;
            }
          }

          // Add the current change to the batch
          currentChanges.push(change);
        });

        // Don't forget to assign the last batch of changes
        if (
          currentChanges.length > 0 &&
          articleIndex < processedNotification.articles.length
        ) {
          processedNotification.articles[articleIndex].changes = [
            ...currentChanges,
          ];
        }

        return processedNotification;
      });

      setNotifications(processedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  const toggleNotificationExpand = (id) => {
    setExpandedNotification(expandedNotification === id ? null : id);
  };

  const toggleArticleExpand = (articleId) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [articleId]: !prev[articleId],
    }));
  };

  const toggleDescriptionExpand = (id) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSummaryExpand = (id) => {
    setExpandedSummaries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleBookmark = (id) => {
    setBookmarkedNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "undefined")
      return "Datum nicht verfügbar";
    try {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Date(dateString).toLocaleDateString("de-AT", options);
    } catch (error) {
      return dateString;
    }
  };

  const renderChange = (change) => {
    // Extract the paragraph number from the instruction
    const paragraphMatch = change.instruction.match(
      /§\s*\d+[a-z]*(?:\s*Abs\.\s*\d+)?/
    );
    const paragraph = paragraphMatch ? paragraphMatch[0] : "";

    return (
      <View
        key={change.id}
        className="mb-4 pb-3 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
      >
        <View className="bg-gray-200 px-3 py-1.5 rounded mb-2">
          <Text className="text-black font-medium">{paragraph}</Text>
        </View>

        <View className="mb-2">
          <Text className="text-gray-900 mb-1">{change.instruction}</Text>

          {change.newText && change.newText.trim() !== "" && (
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
      <SafeAreaView
        className="flex-1 bg-white"
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <View className="flex-1 p-5 items-center justify-center">
          <Text className="text-red-500 mb-4">
            Fehler beim Laden der Benachrichtigungen
          </Text>
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
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
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
            <Text className="text-gray-500">
              Keine Benachrichtigungen vorhanden
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View
              key={notification.id}
              className={`mb-4 rounded-xl border overflow-hidden ${
                notification.isRead ? "border-gray-200" : "border-primary"
              }`}
            >
              <TouchableOpacity
                className={`p-4 ${
                  notification.isRead ? "bg-gray-50" : "bg-white"
                }`}
                onPress={() => toggleNotificationExpand(notification.id)}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center flex-1">
                    {!notification.isRead && (
                      <View className="bg-primary h-3 w-3 rounded-full mr-2 mt-1.5" />
                    )}
                    <View className="flex-1">
                      <Text
                        className={`text-lg font-bold ${
                          notification.isRead ? "text-gray-700" : "text-black"
                        }`}
                      >
                        {notification.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleDescriptionExpand(notification.id)}
                        className="mt-1"
                      >
                        <Text
                          className={`text-gray-600 font-medium ${
                            !expandedDescriptions[notification.id]
                              ? "line-clamp-2"
                              : ""
                          }`}
                          numberOfLines={
                            expandedDescriptions[notification.id]
                              ? undefined
                              : 2
                          }
                        >
                          {notification.description}
                        </Text>
                        {notification.description.length > 100 && (
                          <Text className="text-primary text-sm mt-1">
                            {expandedDescriptions[notification.id]
                              ? "Weniger anzeigen"
                              : "Mehr anzeigen"}
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
                        name={
                          bookmarkedNotifications[notification.id]
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={24}
                        color={
                          bookmarkedNotifications[notification.id]
                            ? "#2196F3"
                            : "#2196F3"
                        }
                      />
                    </TouchableOpacity>
                    {!notification.isRead && (
                      <View className="bg-primary py-1 px-2 rounded mr-2">
                        <Text className="text-white text-xs">Neu</Text>
                      </View>
                    )}
                    <Text className="text-primary text-xl">
                      {expandedNotification === notification.id ? "▼" : "▶"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-2">
                  <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                    <Text className="text-xs text-gray-600">
                      {notification.category}
                    </Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                    <Text className="text-xs text-gray-600">
                      {notification.jurisdiction}
                    </Text>
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
                  {/* AI Summary Section */}
                  {notification.aiSummary && (
                    <View className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <View className="flex-row items-center mb-2">
                        <Ionicons
                          name="sparkles-outline"
                          size={18}
                          color="#2196F3"
                        />
                        <Text className="text-primary font-bold ml-1">
                          KI-Zusammenfassung
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => toggleSummaryExpand(notification.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="text-gray-700"
                          numberOfLines={
                            expandedSummaries[notification.id] ? undefined : 3
                          }
                        >
                          {notification.aiSummary}
                        </Text>
                        {notification.aiSummary.length > 150 && (
                          <Text className="text-primary text-sm mt-1">
                            {expandedSummaries[notification.id]
                              ? "Weniger anzeigen"
                              : "Mehr anzeigen"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Articles Section with Changes */}
                  {notification.articles?.map((article) => (
                    <View
                      key={article.id}
                      className="mb-3 border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <TouchableOpacity
                        className="p-3 bg-white flex-row justify-between items-center"
                        onPress={() => toggleArticleExpand(article.id)}
                      >
                        <View>
                          <Text className="font-bold text-base">
                            {article.subtitle || article.title}
                          </Text>
                        </View>
                        <Text className="text-primary">
                          {expandedArticles[article.id] ? "▼" : "▶"}
                        </Text>
                      </TouchableOpacity>

                      {/* Display article changes when expanded */}
                      {expandedArticles[article.id] && (
                        <View className="p-3 bg-gray-50 border-t border-gray-200">
                          {article.changes && article.changes.length > 0 ? (
                            article.changes.map(renderChange)
                          ) : (
                            <Text className="text-gray-500 italic">
                              Keine Änderungen vorhanden
                            </Text>
                          )}
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
