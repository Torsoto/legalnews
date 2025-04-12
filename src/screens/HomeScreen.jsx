import React, { useState } from "react";
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
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { clearAuth } from "../utils/auth";
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, collection } from "firebase/firestore";

const legalCategories = [
  {
    id: 1,
    title: "Arbeitsrecht",
    description: "Aktuelle Entwicklungen im Arbeitsrecht",
    longDescription:
      "Das Arbeitsrecht regelt die Rechtsbeziehungen zwischen Arbeitgebern und Arbeitnehmern sowie die Rechte und Pflichten beider Parteien. Es umfasst Themen wie Arbeitsverträge, Kündigungsschutz, Arbeitszeit, Urlaub, Entgeltfortzahlung und Arbeitsschutz.",
    compatibleJurisdictions: ["BR", "EU"], // Nur Bundesrecht und EU-Recht
  },
  {
    id: 2,
    title: "Sozialrecht",
    description: "Neuigkeiten aus dem Bereich Sozialrecht",
    longDescription:
      "Das Sozialrecht umfasst alle Rechtsnormen der sozialen Sicherheit. Dazu gehören die gesetzliche Kranken-, Renten- und Arbeitslosenversicherung, sowie Regelungen zur Sozialhilfe und anderen Sozialleistungen.",
    compatibleJurisdictions: ["BR", "LR", "EU"], // Alle Jurisdiktionen
  },
  {
    id: 3,
    title: "Steuerrecht",
    description: "Updates zu steuerrechtlichen Themen",
    longDescription:
      "Das Steuerrecht regelt die Erhebung von Steuern durch den Staat. Es beinhaltet Vorschriften zu verschiedenen Steuerarten wie Einkommensteuer, Umsatzsteuer, Gewerbesteuer und deren Berechnung, Erhebung und Rechtsmittel.",
    compatibleJurisdictions: ["BR", "LR", "EU"], // Alle Jurisdiktionen
  },
  // Neue Rechtsbereiche
  {
    id: 4,
    title: "Verfassungsrecht",
    description: "Entwicklungen im Verfassungsrecht",
    longDescription:
      "Das Verfassungsrecht behandelt die grundlegende rechtliche Ordnung eines Staates. Es umfasst die Verfassung selbst sowie alle Rechtsnormen mit Verfassungsrang, die Grundrechte, die Organisation und Funktion der staatlichen Organe sowie deren Verhältnis zueinander.",
    compatibleJurisdictions: ["BR", "LR", "EU"], // Alle Jurisdiktionen
  },
  {
    id: 5,
    title: "Verwaltungsrecht",
    description: "Aktuelle Änderungen im Verwaltungsrecht",
    longDescription:
      "Das Verwaltungsrecht regelt das Verhältnis zwischen der öffentlichen Verwaltung und den Bürgern sowie die Organisation und Tätigkeit der öffentlichen Verwaltung selbst. Es umfasst Bereiche wie Baurecht, Umweltrecht, Polizei- und Ordnungsrecht.",
    compatibleJurisdictions: ["BR", "LR", "EU"], // Alle Jurisdiktionen
  },
  {
    id: 6,
    title: "Zivilrecht",
    description: "Neuigkeiten im Zivilrecht",
    longDescription:
      "Das Zivilrecht, auch Privatrecht genannt, regelt die Rechtsbeziehungen zwischen Privatpersonen und juristischen Personen. Es umfasst das Vertragsrecht, Sachenrecht, Schadensersatzrecht und weitere Bereiche der privaten Rechtsbeziehungen.",
    compatibleJurisdictions: ["BR", "EU"], // Bundesrecht und EU-Recht
  },
  {
    id: 7,
    title: "Wirtschaftsprivatrecht",
    description: "Updates zum Wirtschaftsprivatrecht",
    longDescription:
      "Das Wirtschaftsprivatrecht umfasst die rechtlichen Regelungen für wirtschaftliche Aktivitäten zwischen Privatpersonen und Unternehmen. Es beinhaltet Handelsrecht, Gesellschaftsrecht, Wettbewerbsrecht, Urheberrecht und verwandte Rechtsgebiete.",
    compatibleJurisdictions: ["BR", "EU"], // Bundesrecht und EU-Recht
  },
  {
    id: 8,
    title: "Finanzrecht",
    description: "Änderungen im Finanzrecht",
    longDescription:
      "Das Finanzrecht regelt den Umgang mit finanziellen Mitteln im öffentlichen Bereich sowie die Finanzmarktregulierung. Es umfasst das Haushaltsrecht, Finanzausgleich, Banken- und Kapitalmarktrecht sowie Versicherungsaufsichtsrecht.",
    compatibleJurisdictions: ["BR", "EU"], // Bundesrecht und EU-Recht
  },
  {
    id: 9,
    title: "Strafrecht",
    description: "Entwicklungen im Strafrecht",
    longDescription:
      "Das Strafrecht befasst sich mit der staatlichen Sanktionierung von Handlungen, die als strafwürdig angesehen werden. Es umfasst das materielle Strafrecht (Straftaten und Rechtsfolgen) sowie das formelle Strafrecht (Strafverfahrensrecht).",
    compatibleJurisdictions: ["BR", "EU"], // Bundesrecht und EU-Recht
  },
  {
    id: 10,
    title: "Verfahrensrecht",
    description: "Aktuelle Änderungen im Verfahrensrecht",
    longDescription:
      "Das Verfahrensrecht regelt die formellen Abläufe von Gerichtsverfahren und Verwaltungsverfahren. Es umfasst die Zivilprozessordnung, Strafprozessordnung, Verwaltungsverfahrensgesetze und weitere verfahrensrechtliche Vorschriften.",
    compatibleJurisdictions: ["BR", "LR"], // Bundesrecht und Landesrecht
  },
  {
    id: 11,
    title: "Jugendrechtliche Vorschriften",
    description: "Updates zu jugendrechtlichen Themen",
    longDescription:
      "Die jugendrechtlichen Vorschriften umfassen alle Rechtsnormen, die speziell für Kinder und Jugendliche gelten. Dazu gehören arbeitsrechtliche Bestimmungen wie das Kinder- und Jugendlichen-Beschäftigungsgesetz, schulrechtliche Vorschriften wie das Schulpflichtgesetz, strafrechtliche Normen wie das Jugendgerichtsgesetz und verwaltungsrechtliche Regelungen.",
    compatibleJurisdictions: ["BR", "LR"], // Bundesrecht und Landesrecht
  },
];

const jurisdictions = [
  { id: "BR", shortLabel: "BR", label: "Bundesrecht", color: "#4CAF50" },
  { id: "LR", shortLabel: "LR", label: "Landesrecht", color: "#2196F3" },
  { id: "EU", shortLabel: "EU", label: "EU-Recht", color: "#FFC107" },
];

const HomeScreen = ({ navigation }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(1); // Mock count for UI
  const [selectedCategories, setSelectedCategories] = useState({});
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const SERVER_URL = "http://192.168.0.136:3000/api/notifications";

  // Set up the header right configuration
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center mr-4">
          <TouchableOpacity
            className="mr-6"
            onPress={() => navigation.navigate("Benachrichtigungen")}
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
            {unreadNotifications > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, unreadNotifications, showMenu]);

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

  const toggleExpand = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleJurisdiction = (jurisdictionId) => {
    // Check if we're adding a jurisdiction
    const isAdding = !selectedJurisdictions.includes(jurisdictionId);

    if (isAdding) {
      // Get all currently selected categories
      const selectedCategoryIds = Object.keys(selectedCategories).map((id) =>
        parseInt(id)
      );

      // Check if the new jurisdiction is compatible with all selected categories
      const incompatibleCategories = [];

      selectedCategoryIds.forEach((categoryId) => {
        const category = legalCategories.find((c) => c.id === categoryId);
        if (!category.compatibleJurisdictions.includes(jurisdictionId)) {
          incompatibleCategories.push(category.title);
        }
      });

      // If there are incompatible categories, show warning and ask for confirmation
      if (incompatibleCategories.length > 0) {
        Alert.alert(
          "Inkompatible Auswahl",
          `Die Jurisdiktion "${
            jurisdictions.find((j) => j.id === jurisdictionId).label
          }" ist nicht kompatibel mit folgenden bereits ausgewählten Rechtsbereichen:\n\n${incompatibleCategories.join(
            "\n"
          )}\n\nMöchten Sie diese Rechtsbereiche entfernen?`,
          [
            {
              text: "Abbrechen",
              style: "cancel",
            },
            {
              text: "Rechtsbereiche entfernen",
              onPress: () => {
                // Remove incompatible categories and add the jurisdiction
                const newSelectedCategories = { ...selectedCategories };

                selectedCategoryIds.forEach((categoryId) => {
                  const category = legalCategories.find(
                    (c) => c.id === categoryId
                  );
                  if (
                    !category.compatibleJurisdictions.includes(jurisdictionId)
                  ) {
                    delete newSelectedCategories[categoryId];
                  }
                });

                setSelectedCategories(newSelectedCategories);
                setSelectedJurisdictions((prev) => [...prev, jurisdictionId]);
              },
            },
          ]
        );
        return;
      }
    }

    // If removing or if no incompatibilities when adding
    setSelectedJurisdictions((prev) => {
      if (prev.includes(jurisdictionId)) {
        return prev.filter((id) => id !== jurisdictionId);
      } else {
        return [...prev, jurisdictionId];
      }
    });
  };

  const toggleCategory = (categoryId) => {
    const category = legalCategories.find((c) => c.id === categoryId);

    // Check if ALL selected jurisdictions are compatible with this category
    const allJurisdictionsCompatible = selectedJurisdictions.every((jId) =>
      category.compatibleJurisdictions.includes(jId)
    );

    if (!allJurisdictionsCompatible) {
      const incompatibleJurisdictions = selectedJurisdictions
        .filter((jId) => !category.compatibleJurisdictions.includes(jId))
        .map((jId) => jurisdictions.find((j) => j.id === jId).label)
        .join(", ");

      Alert.alert(
        "Nicht verfügbar",
        `${category.title} ist nicht mit den ausgewählten Rechtsbereichen (${incompatibleJurisdictions}) verfügbar. Bitte wählen Sie kompatible Rechtsbereiche aus.`
      );
      return;
    }

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

  const handleSubscribe = async () => {
    // First check if there are any incompatible combinations
    let hasIncompatibleCombinations = false;
    const selectedCategoryIds = Object.keys(selectedCategories).map((id) =>
      parseInt(id)
    );

    for (const categoryId of selectedCategoryIds) {
      const category = legalCategories.find((c) => c.id === categoryId);

      // Check if ALL selected jurisdictions are compatible with this category
      const allJurisdictionsCompatible = selectedJurisdictions.every((jId) =>
        category.compatibleJurisdictions.includes(jId)
      );

      if (!allJurisdictionsCompatible) {
        hasIncompatibleCombinations = true;
        break;
      }
    }

    if (hasIncompatibleCombinations) {
      Alert.alert(
        "Inkompatible Auswahl",
        "Es gibt inkompatible Kombinationen von Rechtsbereichen und Jurisdiktionen in Ihrer Auswahl. Bitte überprüfen Sie Ihre Auswahl.",
        [{ text: "OK" }]
      );
      return;
    }

    const selectedCategoryItems = legalCategories
      .filter((c) => isCategorySelected(c.id))
      .map((c) => c.title);

    const selectedJurisdictionItems = selectedJurisdictions.map(
      (jId) => jurisdictions.find((j) => j.id === jId).label
    );

    if (selectedCategoryItems.length === 0) {
      Alert.alert(
        "Hinweis",
        "Bitte wählen Sie mindestens einen Rechtsbereich aus."
      );
      return;
    }

    if (selectedJurisdictionItems.length === 0) {
      Alert.alert(
        "Hinweis",
        "Bitte wählen Sie mindestens eine Jurisdiktion aus."
      );
      return;
    }

    Alert.alert(
      "Bestätigung",
      `Sie abonnieren:\n\nRechtsbereiche:\n${selectedCategoryItems.join(
        "\n"
      )}\n\nJurisdiktionen:\n${selectedJurisdictionItems.join("\n")}`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Bestätigen",
          onPress: async () => {
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
              const batch = await import("firebase/firestore").then((module) =>
                module.writeBatch(db)
              );

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
                "Ihre Abonnements wurden erfolgreich angelegt!"
              );
            } catch (error) {
              console.error("Subscription error:", error);
              Alert.alert(
                "Fehler",
                "Beim Speichern Ihrer Abonnements ist ein Fehler aufgetreten."
              );
            }
          },
        },
      ]
    );
  };

  const isCategoryCompatible = (category) => {
    if (selectedJurisdictions.length === 0) return true;

    // Check if ALL selected jurisdictions are compatible with this category
    return selectedJurisdictions.every((jId) =>
      category.compatibleJurisdictions.includes(jId)
    );
  };

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  const getSelectedCount = () => {
    const categoriesCount = Object.keys(selectedCategories).length;
    const jurisdictionsCount = selectedJurisdictions.length;

    if (categoriesCount > 0 && jurisdictionsCount > 0) {
      return `${categoriesCount} Bereich(e), ${jurisdictionsCount} Jurisdiktion(en)`;
    } else if (categoriesCount > 0) {
      return `${categoriesCount} Bereich(e)`;
    } else if (jurisdictionsCount > 0) {
      return `${jurisdictionsCount} Jurisdiktion(en)`;
    }

    return "Keine Auswahl";
  };

  const clearAllSelections = () => {
    setSelectedCategories({});
    setSelectedJurisdictions([]);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
      >
        <View className="flex-1">
          <View className="absolute top-16 right-4 bg-white rounded-lg shadow-lg w-48 z-50">
            <TouchableOpacity
              className="px-4 py-3 border-b border-gray-200 flex-row items-center"
              onPress={() => {
                setShowMenu(false);
                setTimeout(() => navigation.navigate("Profil"), 100);
              }}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color="#666"
                className="mr-2"
              />
              <Text className="text-gray-800 ml-2">Profil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-3 flex-row items-center"
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#EF4444"
                className="mr-2"
              />
              <Text className="text-red-500 ml-2">Abmelden</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="flex-1"
            activeOpacity={0}
            onPress={() => setShowMenu(false)}
          />
        </View>
      </Modal>

      {/* Filter section */}
      <View className="border-b border-gray-200">
        <TouchableOpacity
          className="flex-row justify-between items-center px-5 py-3 bg-gray-50"
          onPress={toggleFilters}
        >
          <View className="flex-row items-center">
            <Text className="font-bold mr-2">Filter:</Text>
            <Text className="text-gray-500">{getSelectedCount()}</Text>
          </View>
          <View className="flex-row items-center">
            {(selectedJurisdictions.length > 0 ||
              Object.keys(selectedCategories).length > 0) && (
              <TouchableOpacity
                className="mr-3 px-2 py-1 bg-gray-200 rounded"
                onPress={clearAllSelections}
              >
                <Text className="text-xs">Zurücksetzen</Text>
              </TouchableOpacity>
            )}
            <Text className="text-primary text-xl">
              {filtersExpanded ? "▼" : "▶"}
            </Text>
          </View>
        </TouchableOpacity>

        {filtersExpanded && (
          <View className="p-4 bg-gray-50">
            <Text className="font-bold mb-2">Rechtsgebiete:</Text>
            <View className="flex-row flex-wrap mb-4">
              {jurisdictions.map((jurisdiction) => (
                <TouchableOpacity
                  key={jurisdiction.id}
                  className="mr-2 mb-2"
                  onPress={() => toggleJurisdiction(jurisdiction.id)}
                >
                  <View
                    className={`py-2 px-4 rounded-full flex-row items-center ${
                      selectedJurisdictions.includes(jurisdiction.id)
                        ? "border-2"
                        : "opacity-70"
                    }`}
                    style={{
                      backgroundColor: jurisdiction.color,
                      borderColor: selectedJurisdictions.includes(
                        jurisdiction.id
                      )
                        ? "white"
                        : "transparent",
                    }}
                  >
                    <Text className="text-white font-bold">
                      {jurisdiction.shortLabel}
                    </Text>
                    <Text className="text-white text-xs ml-1">
                      ({jurisdiction.label})
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {selectedJurisdictions.length > 0 &&
              Object.keys(selectedCategories).length > 0 && (
                <TouchableOpacity
                  className="py-2 px-4 rounded-lg bg-primary self-start"
                  onPress={handleSubscribe}
                >
                  <Text className="text-white font-bold">Abonnieren</Text>
                </TouchableOpacity>
              )}
          </View>
        )}
      </View>

      {/* Main content */}
      <ScrollView className="flex-1 px-4">
        <Text className="text-xl font-bold my-5">Rechtsbereiche</Text>

        {legalCategories.map((category) => {
          const isCompatible = isCategoryCompatible(category);

          return (
            <View
              key={category.id}
              className={`${
                isCompatible ? "bg-gray-50" : "bg-gray-100"
              } rounded-xl mb-4 border border-gray-200 overflow-hidden relative`}
              style={{ opacity: isCompatible ? 1 : 0.7 }}
            >
              <TouchableOpacity
                className="absolute top-3 right-3 z-10 p-2"
                onPress={() => toggleExpand(category.id)}
              >
                <Text className="text-primary text-xl">
                  {expandedCategory === category.id ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-start p-5"
                onPress={() => isCompatible && toggleCategory(category.id)}
                disabled={!isCompatible}
              >
                {isCompatible && (
                  <View className="w-6 h-6 rounded-md border-2 border-primary items-center justify-center mt-1 mr-3">
                    {isCategorySelected(category.id) && (
                      <View className="w-4 h-4 rounded-sm bg-primary" />
                    )}
                  </View>
                )}

                <View className="flex-1 pr-8">
                  <Text
                    className={`text-lg font-bold mb-2 ${
                      isCompatible ? "text-black" : "text-gray-500"
                    }`}
                  >
                    {category.title}
                  </Text>
                  <Text
                    className={`${
                      isCompatible ? "text-gray-600" : "text-gray-500"
                    }`}
                  >
                    {category.description}
                  </Text>
                </View>
              </TouchableOpacity>

              {expandedCategory === category.id && (
                <View className="px-5 pb-5">
                  <Text className="text-gray-700 mb-4">
                    {category.longDescription}
                  </Text>

                  <Text className="font-bold mb-3">
                    Verfügbare Jurisdiktionen:
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {jurisdictions
                      .filter((j) =>
                        category.compatibleJurisdictions.includes(j.id)
                      )
                      .map((jurisdiction) => (
                        <View
                          key={jurisdiction.id}
                          className="py-2 px-4 rounded-lg"
                          style={{
                            backgroundColor: jurisdiction.color,
                            opacity: 0.7,
                          }}
                        >
                          <Text className="text-white font-semibold">
                            {jurisdiction.shortLabel}
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
