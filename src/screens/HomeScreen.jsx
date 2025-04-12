import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  Animated,
  Image,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { clearAuth } from "../utils/auth";
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, collection, writeBatch } from "firebase/firestore";
import { legalCategories, jurisdictions, API } from "../constants";

const HomeScreen = ({ navigation }) => {
  // States
  const [unreadNotifications, setUnreadNotifications] = useState(1); // Mock count for UI
  const [showMenu, setShowMenu] = useState(false);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [subscriptionStep, setSubscriptionStep] = useState(1); // 1: Categories, 2: Jurisdictions, 3: Review
  const [fadeAnim] = useState(new Animated.Value(1));
  const SERVER_URL = API.BASE_URL + API.ENDPOINTS.NOTIFICATIONS;

  // Animate transitions between steps
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [subscriptionStep]);

  // Set up the header right configuration
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide the default header
    });
  }, [navigation]);

  const handleLogout = async () => {
    try {
      setShowMenu(false); // Close the menu first
      await signOut(auth);
      await clearAuth();
      // Navigation will be handled by the auth state change in App.jsx
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Fehler beim Abmelden", error.message);
    }
  };

  // Methods for jurisdictions
  const toggleJurisdiction = (jurisdictionId) => {
    setSelectedJurisdictions((prev) => {
      if (prev.includes(jurisdictionId)) {
        return prev.filter((id) => id !== jurisdictionId);
      } else {
        return [...prev, jurisdictionId];
      }
    });
  };

  // Methods for categories
  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      const newSelection = { ...prev };
      if (newSelection[categoryId]) {
        delete newSelection[categoryId];
      } else {
        newSelection[categoryId] = true;
      }
      return newSelection;
    });
  };

  const isCategorySelected = (categoryId) => {
    return selectedCategories[categoryId] || false;
  };

  // Category compatibility check
  const isCategoryCompatibleWithJurisdictions = (category) => {
    if (selectedJurisdictions.length === 0) return true;
    
    return selectedJurisdictions.every((jId) =>
      category.compatibleJurisdictions.includes(jId)
    );
  };

  // Jurisdiction compatibility check
  const isJurisdictionCompatibleWithCategories = (jurisdictionId) => {
    const selectedCategoryIds = Object.keys(selectedCategories).map((id) => parseInt(id));
    
    if (selectedCategoryIds.length === 0) return true;
    
    return selectedCategoryIds.every((categoryId) => {
      const category = legalCategories.find((c) => c.id === categoryId);
      return category.compatibleJurisdictions.includes(jurisdictionId);
    });
  };

  // Navigation between steps
  const goToNextStep = () => {
    if (subscriptionStep === 1 && Object.keys(selectedCategories).length === 0) {
      Alert.alert("Bitte wählen Sie", "Bitte wählen Sie mindestens einen Rechtsbereich aus.");
      return;
    }
    
    if (subscriptionStep === 2 && selectedJurisdictions.length === 0) {
      Alert.alert("Bitte wählen Sie", "Bitte wählen Sie mindestens eine Jurisdiktion aus.");
      return;
    }
    
    setSubscriptionStep(prev => Math.min(prev + 1, 3));
  };

  const goToPreviousStep = () => {
    setSubscriptionStep(prev => Math.max(prev - 1, 1));
  };

  const resetSubscription = () => {
    setSelectedCategories({});
    setSelectedJurisdictions([]);
    setSubscriptionStep(1);
  };

  // Handle the subscription creation
  const handleSubscribe = async () => {
    try {
      // Get the current user
      const userId = auth.currentUser?.uid;

      if (!userId) {
        Alert.alert(
          "Fehler",
          "Sie müssen angemeldet sein, um Abonnements zu erstellen."
        );
        return;
      }

      // Create a map of jurisdictions with boolean values
      const jurisdictionMap = {};
      jurisdictions.forEach((jurisdiction) => {
        jurisdictionMap[jurisdiction.id] =
          selectedJurisdictions.includes(jurisdiction.id);
      });

      // Add timestamp fields
      const subscriptionData = {
        ...jurisdictionMap,
        updatedAt: new Date().toISOString(),
      };

      // Create a batch to perform multiple writes atomically
      const batch = writeBatch(db);

      // For each selected category, create a document
      const selectedCategoryIds = Object.keys(selectedCategories).map(
        (id) => parseInt(id)
      );

      for (const categoryId of selectedCategoryIds) {
        const category = legalCategories.find(
          (c) => c.id === categoryId
        );
        const categoryName = category.title;

        // Reference to the user's document in this category
        const userSubscriptionRef = doc(
          db,
          "subscriptions",
          categoryName,
          "users",
          userId
        );

        // Add the subscription to the batch
        batch.set(userSubscriptionRef, subscriptionData);
      }

      // Commit the batch
      await batch.commit();

      Alert.alert(
        "Erfolg",
        "Ihre Abonnements wurden erfolgreich angelegt!",
        [
          {
            text: "OK",
            onPress: resetSubscription
          }
        ]
      );
    } catch (error) {
      console.error("Subscription error:", error);
      Alert.alert(
        "Fehler",
        "Beim Speichern Ihrer Abonnements ist ein Fehler aufgetreten."
      );
    }
  };

  // Render step indicators
  const renderStepIndicators = () => (
    <View className="flex-row justify-center items-center space-x-2 mb-4">
      {[1, 2, 3].map((step) => (
        <View 
          key={step} 
          className={`h-2 rounded-full ${
            step === subscriptionStep 
              ? "w-8 bg-primary" 
              : step < subscriptionStep 
                ? "w-8 bg-green-500" 
                : "w-2 bg-gray-300"
          }`}
        />
      ))}
    </View>
  );

  // Render Category Selection Step
  const renderCategorySelection = () => (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <View className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
        <Text className="text-center text-lg font-bold mb-2">
          Schritt 1: Wählen Sie Ihre Rechtsbereiche
        </Text>
        <Text className="text-center text-gray-600 mb-2">
          Wählen Sie die Rechtsbereiche, über die Sie informiert werden möchten
        </Text>
        {renderStepIndicators()}
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 flex-row flex-wrap justify-between">
          {legalCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              className={`mb-4 p-4 rounded-xl w-[48%] ${
                isCategorySelected(category.id)
                  ? "bg-primary"
                  : "bg-white border border-gray-200"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 3,
              }}
            >
              <View className="items-center">
                <View className="mb-2 h-10 justify-center">
                  <Ionicons
                    name={getCategoryIcon(category.id)}
                    size={24}
                    color={isCategorySelected(category.id) ? "white" : "#333"}
                  />
                </View>
                <Text
                  className={`text-center font-bold mb-1 ${
                    isCategorySelected(category.id) ? "text-white" : "text-black"
                  }`}
                >
                  {category.title}
                </Text>
                <Text
                  className={`text-center text-xs ${
                    isCategorySelected(category.id) ? "text-white" : "text-gray-600"
                  }`}
                  numberOfLines={2}
                >
                  {category.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={resetSubscription}
            className="px-5 py-2 rounded-lg border border-gray-300"
          >
            <Text className="text-gray-700 font-medium">Zurücksetzen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNextStep}
            className="px-5 py-2 rounded-lg bg-primary"
            disabled={Object.keys(selectedCategories).length === 0}
            style={{
              opacity: Object.keys(selectedCategories).length > 0 ? 1 : 0.5,
            }}
          >
            <Text className="text-white font-medium">Weiter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  // Render Jurisdiction Selection Step
  const renderJurisdictionSelection = () => (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <View className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
        <Text className="text-center text-lg font-bold mb-2">
          Schritt 2: Wählen Sie Rechtsgebiete
        </Text>
        <Text className="text-center text-gray-600 mb-2">
          Wählen Sie die Rechtsgebiete, die für Sie relevant sind
        </Text>
        {renderStepIndicators()}
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="mb-6">
          <Text className="text-md font-semibold mb-4">
            Ausgewählte Rechtsbereiche:
          </Text>
          <View className="flex-row flex-wrap">
            {Object.keys(selectedCategories).map((id) => {
              const category = legalCategories.find(
                (c) => c.id === parseInt(id)
              );
              return (
                <View
                  key={id}
                  className="bg-primary bg-opacity-20 rounded-full px-3 py-1 mr-2 mb-2"
                >
                  <Text className="text-primary font-medium">{category.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text className="text-md font-semibold mb-4">
          Wählen Sie Ihre Rechtsgebiete:
        </Text>

        <View className="space-y-4">
          {jurisdictions.map((jurisdiction) => {
            const isCompatible = selectedCategories && Object.keys(selectedCategories).length > 0
              ? Object.keys(selectedCategories).every((categoryId) => {
                  const category = legalCategories.find((c) => c.id === parseInt(categoryId));
                  return category.compatibleJurisdictions.includes(jurisdiction.id);
                })
              : true;
              
            return (
              <TouchableOpacity
                key={jurisdiction.id}
                onPress={() => toggleJurisdiction(jurisdiction.id)}
                disabled={!isCompatible}
                className={`p-3 rounded-lg flex-row items-center ${
                  !isCompatible
                    ? "bg-gray-100 opacity-50"
                    : selectedJurisdictions.includes(jurisdiction.id)
                    ? "bg-white border-2 border-primary"
                    : "bg-white border border-gray-200"
                }`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 1,
                  elevation: 2,
                }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: jurisdiction.color }}
                >
                  <Text className="text-white font-bold">{jurisdiction.shortLabel}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold">{jurisdiction.label}</Text>
                  <Text className="text-xs text-gray-500">
                    {getJurisdictionDescription(jurisdiction.id)}
                  </Text>
                </View>
                {selectedJurisdictions.includes(jurisdiction.id) && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={goToPreviousStep}
            className="px-5 py-2 rounded-lg border border-gray-300"
          >
            <Text className="text-gray-700 font-medium">Zurück</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNextStep}
            className="px-5 py-2 rounded-lg bg-primary"
            disabled={selectedJurisdictions.length === 0}
            style={{
              opacity: selectedJurisdictions.length > 0 ? 1 : 0.5,
            }}
          >
            <Text className="text-white font-medium">Weiter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  // Render Review and Confirm Step
  const renderReviewStep = () => {
    const selectedCategoryItems = legalCategories
      .filter((c) => isCategorySelected(c.id))
      .map((c) => c.title);

    const selectedJurisdictionItems = selectedJurisdictions.map(
      (jId) => jurisdictions.find((j) => j.id === jId).label
    );

    return (
      <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
        <View className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
          <Text className="text-center text-lg font-bold mb-2">
            Schritt 3: Bestätigen Sie Ihr Abonnement
          </Text>
          <Text className="text-center text-gray-600 mb-2">
            Überprüfen Sie Ihre Auswahl und bestätigen Sie Ihr Abonnement
          </Text>
          {renderStepIndicators()}
        </View>

        <ScrollView className="flex-1 px-4">
          <View className="bg-white rounded-lg p-5 mb-5 border border-gray-200">
            <Text className="text-lg font-bold mb-4 text-center">
              Zusammenfassung
            </Text>

            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2">
                  <Ionicons name="list" size={18} color="white" />
                </View>
                <Text className="text-lg font-semibold">Rechtsbereiche</Text>
              </View>
              {selectedCategoryItems.map((category) => (
                <View key={category} className="ml-10 mb-1 flex-row items-center">
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  <Text className="ml-2">{category}</Text>
                </View>
              ))}
            </View>

            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2">
                  <Ionicons name="globe-outline" size={18} color="white" />
                </View>
                <Text className="text-lg font-semibold">Rechtsgebiete</Text>
              </View>
              {selectedJurisdictionItems.map((jurisdiction) => (
                <View key={jurisdiction} className="ml-10 mb-1 flex-row items-center">
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  <Text className="ml-2">{jurisdiction}</Text>
                </View>
              ))}
            </View>

            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="text-sm text-gray-600 text-center">
                Durch die Bestätigung erhalten Sie regelmäßige Updates zu den ausgewählten Rechtsbereichen und Rechtsgebieten.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="p-4 bg-white border-t border-gray-200">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={goToPreviousStep}
              className="px-5 py-2 rounded-lg border border-gray-300"
            >
              <Text className="text-gray-700 font-medium">Zurück</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubscribe}
              className="px-5 py-2 rounded-lg bg-primary"
            >
              <Text className="text-white font-medium">Abonnieren</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Helper functions
  const getCategoryIcon = (categoryId) => {
    const iconMap = {
      1: "briefcase-outline", // Arbeitsrecht
      2: "people-outline", // Sozialrecht
      3: "cash-outline", // Steuerrecht
      4: "shield-outline", // Verfassungsrecht
      5: "business-outline", // Verwaltungsrecht
      6: "document-text-outline", // Zivilrecht
      7: "storefront-outline", // Wirtschaftsprivatrecht
      8: "card-outline", // Finanzrecht
      9: "hand-left-outline", // Strafrecht
      10: "hammer-outline", // Verfahrensrecht
      11: "school-outline", // Jugendrechtliche Vorschriften
    };
    
    return iconMap[categoryId] || "document-outline";
  };

  const getJurisdictionDescription = (jurisdictionId) => {
    const descriptionMap = {
      "BR": "Gesetze und Verordnungen auf Bundesebene",
      "LR": "Gesetze und Verordnungen der Bundesländer",
      "EU": "Rechtsakte der Europäischen Union"
    };
    
    return descriptionMap[jurisdictionId] || "";
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Custom Header */}
      <View className="bg-white shadow-sm border-b border-gray-100 mb-2">
        <View className="flex-row justify-between items-center pt-2 pb-3 px-4">
          <Text className="text-xl font-bold text-gray-800">Meine Abonnements</Text>
        </View>
      </View>
      
      {/* Content based on current step */}
      {subscriptionStep === 1 && renderCategorySelection()}
      {subscriptionStep === 2 && renderJurisdictionSelection()}
      {subscriptionStep === 3 && renderReviewStep()}
    </SafeAreaView>
  );
};

export default HomeScreen;
