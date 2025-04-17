import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { legalCategories, jurisdictions, bundeslaender } from "../../constants";
import { isLandesrechtSelected } from "../../utils/subscriptionHelpers";
import StepIndicator from "./StepIndicator";

const ReviewStep = ({
  fadeAnim,
  selectedCategories,
  selectedJurisdictions,
  selectedBundeslaender,
  goToPreviousStep,
  handleSubscribe,
  currentStep,
}) => {
  const selectedCategoryItems = legalCategories
    .filter((c) => selectedCategories[c.id])
    .map((c) => c.title);

  const selectedJurisdictionItems = selectedJurisdictions.map(
    (jId) => jurisdictions.find((j) => j.id === jId).label
  );
  
  const selectedBundeslandItems = isLandesrechtSelected(selectedJurisdictions) 
    ? selectedBundeslaender.map(
        (bId) => bundeslaender.find((b) => b.id === bId).name
      )
    : [];

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <View className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
        <Text className="text-center text-lg font-bold mb-2">
          {isLandesrechtSelected(selectedJurisdictions) ? "Schritt 4: Bestätigen Sie Ihr Abonnement" : "Schritt 3: Bestätigen Sie Ihr Abonnement"}
        </Text>
        <Text className="text-center text-gray-600 mb-2">
          Überprüfen Sie Ihre Auswahl und bestätigen Sie Ihr Abonnement
        </Text>
        <StepIndicator currentStep={currentStep} selectedJurisdictions={selectedJurisdictions} />
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

          {isLandesrechtSelected(selectedJurisdictions) && selectedBundeslandItems.length > 0 && (
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2">
                  <Ionicons name="location-outline" size={18} color="white" />
                </View>
                <Text className="text-lg font-semibold">Bundesländer</Text>
              </View>
              {selectedBundeslandItems.map((bundesland) => (
                <View key={bundesland} className="ml-10 mb-1 flex-row items-center">
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  <Text className="ml-2">{bundesland}</Text>
                </View>
              ))}
            </View>
          )}

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

export default ReviewStep; 