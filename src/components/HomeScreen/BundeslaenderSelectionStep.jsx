import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { jurisdictions, bundeslaender } from "../../constants";
import StepIndicator from "./StepIndicator";

const BundeslaenderSelectionStep = ({
  fadeAnim,
  selectedJurisdictions,
  selectedBundeslaender,
  toggleBundesland,
  goToPreviousStep,
  goToNextStep,
  currentStep,
}) => {
  return (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <View className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
        <Text className="text-center text-lg font-bold mb-2">
          Schritt 3: Wählen Sie Bundesländer
        </Text>
        <Text className="text-center text-gray-600 mb-2">
          Wählen Sie die Bundesländer, deren Landesrecht für Sie relevant ist
        </Text>
        <StepIndicator currentStep={currentStep} selectedJurisdictions={selectedJurisdictions} />
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="mb-6">
          <Text className="text-md font-semibold mb-4">
            Ausgewählte Rechtsgebiete:
          </Text>
          <View className="flex-row flex-wrap">
            {selectedJurisdictions.map((jId) => {
              const jurisdiction = jurisdictions.find(j => j.id === jId);
              return (
                <View
                  key={jId}
                  className="bg-primary bg-opacity-20 rounded-full px-3 py-1 mr-2 mb-2"
                >
                  <Text className="text-white font-medium">{jurisdiction.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text className="text-md font-semibold mb-4">
          Wählen Sie Bundesländer:
        </Text>

        <View className="space-y-4">
          {bundeslaender.map((bundesland) => (
            <TouchableOpacity
              key={bundesland.id}
              onPress={() => toggleBundesland(bundesland.id)}
              className={`p-3 rounded-lg flex-row items-center ${
                selectedBundeslaender.includes(bundesland.id)
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
                style={{ backgroundColor: bundesland.color }}
              >
                <Text className="text-white font-bold text-xs">{bundesland.id}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold">{bundesland.name}</Text>
              </View>
              {selectedBundeslaender.includes(bundesland.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
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
            disabled={selectedBundeslaender.length === 0}
            style={{
              opacity: selectedBundeslaender.length > 0 ? 1 : 0.5,
            }}
          >
            <Text className="text-white font-medium">Weiter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default BundeslaenderSelectionStep; 