import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { clearAuth } from "../utils/auth";
import { doc, setDoc, writeBatch } from "firebase/firestore";
import { legalCategories, jurisdictions, bundeslaender } from "../constants";
import { 
  isLandesrechtSelected, 
  getMaxStep 
} from "../utils/subscriptionHelpers";

// Import Components
import CategorySelectionStep from "../components/HomeScreen/CategorySelectionStep";
import JurisdictionSelectionStep from "../components/HomeScreen/JurisdictionSelectionStep";
import BundeslaenderSelectionStep from "../components/HomeScreen/BundeslaenderSelectionStep";
import ReviewStep from "../components/HomeScreen/ReviewStep";

const HomeScreen = ({ navigation }) => {
  // States
  const [selectedJurisdictions, setSelectedJurisdictions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [selectedBundeslaender, setSelectedBundeslaender] = useState([]);
  const [subscriptionStep, setSubscriptionStep] = useState(1); // 1: Categories, 2: Jurisdictions, 3: Bundesländer (if LR chosen), 4: Review
  const [fadeAnim] = useState(new Animated.Value(1));

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
        // If removing LR, also clear selected Bundesländer
        if (jurisdictionId === "LR") {
          setSelectedBundeslaender([]);
        }
        return prev.filter((id) => id !== jurisdictionId);
      } else {
        return [...prev, jurisdictionId];
      }
    });
  };

  // Toggle Bundesland selection
  const toggleBundesland = (bundeslandId) => {
    setSelectedBundeslaender((prev) => {
      if (prev.includes(bundeslandId)) {
        return prev.filter((id) => id !== bundeslandId);
      } else {
        return [...prev, bundeslandId];
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
    
    if (subscriptionStep === 3 && isLandesrechtSelected(selectedJurisdictions) && selectedBundeslaender.length === 0) {
      Alert.alert("Bitte wählen Sie", "Bitte wählen Sie mindestens ein Bundesland aus.");
      return;
    }
    
    // If we're at step 2 and Landesrecht is not selected, skip the Bundesländer step
    if (subscriptionStep === 2 && !isLandesrechtSelected(selectedJurisdictions)) {
      setSubscriptionStep(3);
      return;
    }
    
    setSubscriptionStep(prev => Math.min(prev + 1, getMaxStep(selectedJurisdictions)));
  };

  const goToPreviousStep = () => {
    // If we're at step 3 (review) and Landesrecht is not selected, go back to step 2
    if (subscriptionStep === 3 && !isLandesrechtSelected(selectedJurisdictions)) {
      setSubscriptionStep(2);
      return;
    }
    
    setSubscriptionStep(prev => Math.max(prev - 1, 1));
  };

  const resetSubscription = () => {
    setSelectedCategories({});
    setSelectedJurisdictions([]);
    setSelectedBundeslaender([]);
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

      // Create subscription data with new structure
      const subscriptionData = {
        // Basic jurisdictions
        BR: selectedJurisdictions.includes("BR"),
        EU: selectedJurisdictions.includes("EU"),
        
        // LR is now a map containing all selected Bundesländer
        LR: selectedJurisdictions.includes("LR") 
          ? bundeslaender.reduce((map, bundesland) => {
              map[bundesland.id] = selectedBundeslaender.includes(bundesland.id);
              return map;
            }, {})
          : false,
        
        // Add timestamp field
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
      {subscriptionStep === 1 && (
        <CategorySelectionStep
          fadeAnim={fadeAnim}
          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}
          resetSubscription={resetSubscription}
          goToNextStep={goToNextStep}
          currentStep={subscriptionStep}
          selectedJurisdictions={selectedJurisdictions}
        />
      )}
      
      {subscriptionStep === 2 && (
        <JurisdictionSelectionStep
          fadeAnim={fadeAnim}
          selectedCategories={selectedCategories}
          selectedJurisdictions={selectedJurisdictions}
          toggleJurisdiction={toggleJurisdiction}
          goToPreviousStep={goToPreviousStep}
          goToNextStep={goToNextStep}
          currentStep={subscriptionStep}
        />
      )}
      
      {subscriptionStep === 3 && isLandesrechtSelected(selectedJurisdictions) && (
        <BundeslaenderSelectionStep
          fadeAnim={fadeAnim}
          selectedJurisdictions={selectedJurisdictions}
          selectedBundeslaender={selectedBundeslaender}
          toggleBundesland={toggleBundesland}
          goToPreviousStep={goToPreviousStep}
          goToNextStep={goToNextStep}
          currentStep={subscriptionStep}
        />
      )}
      
      {((subscriptionStep === 3 && !isLandesrechtSelected(selectedJurisdictions)) || 
        subscriptionStep === 4) && (
        <ReviewStep
          fadeAnim={fadeAnim}
          selectedCategories={selectedCategories}
          selectedJurisdictions={selectedJurisdictions}
          selectedBundeslaender={selectedBundeslaender}
          goToPreviousStep={goToPreviousStep}
          handleSubscribe={handleSubscribe}
          currentStep={subscriptionStep}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;
