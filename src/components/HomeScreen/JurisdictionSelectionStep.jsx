import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { legalCategories, jurisdictions } from "../../constants";
import { getJurisdictionDescription, isJurisdictionCompatibleWithCategories } from "../../utils/subscriptionHelpers";
import StepIndicator from "./StepIndicator";

const JurisdictionSelectionStep = ({
  fadeAnim,
  selectedCategories,
  selectedJurisdictions,
  toggleJurisdiction,
  goToPreviousStep,
  goToNextStep,
  currentStep,
}) => {
  return (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <View className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
        <Text className="text-center text-lg font-bold mb-2">
          Schritt 2: Wählen Sie Rechtsgebiete
        </Text>
        <Text className="text-center text-gray-600 mb-2">
          Wählen Sie die Rechtsgebiete, die für Sie relevant sind
        </Text>
        <StepIndicator currentStep={currentStep} selectedJurisdictions={selectedJurisdictions} />
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="mb-6">
          <Text className="text-md font-semibold mb-4">
            Ausgewählte Rechtsbereiche:
          </Text>
          <View className="flex-row flex-wrap">
            {Object.keys(selectedCategories).map((id) => {
              const categoryId = parseInt(id);
              const category = legalCategories.find(
                (c) => c.id === categoryId
              );
              return (
                <View
                  key={id}
                  className="bg-primary bg-opacity-20 rounded-full px-3 py-1 mr-2 mb-2"
                >
                  <Text className="text-white font-medium">{category?.title || `Kategorie ${id}`}</Text>
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
            const isCompatible = isJurisdictionCompatibleWithCategories(
              jurisdiction.id, 
              selectedCategories, 
              legalCategories
            );
            
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
};

export default JurisdictionSelectionStep; 