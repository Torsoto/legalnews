import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { getPersistedAuth, persistAuth, clearAuth } from "./src/utils/auth";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import EffectiveDatesScreen from "./src/screens/EffectiveDatesScreen";
import LegalNewsScreen from "./src/screens/LegalNewsScreen";
import NewsDetailScreen from "./src/screens/NewsDetailScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPersistedAuth = async () => {
      try {
        const persistedUser = await getPersistedAuth();
        if (persistedUser) {
          setUser(persistedUser);
        }
      } catch (error) {
        console.error("Error checking persisted auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPersistedAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        await persistAuth(user);
        setUser(user);
      } else {
        // User is signed out
        await clearAuth();
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return null; // Or a loading screen
  }

  const TabStack = () => {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Rechtsnews") {
              iconName = focused ? "newspaper" : "newspaper-outline";
            } else if (route.name === "Abonnements") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Profil") {
              iconName = focused ? "person" : "person-outline";
            } else if (route.name === "Inkrafttreten") {
              iconName = focused ? "timer" : "timer-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
          headerShown: false,
        })}
      >
        <Tab.Screen name="Rechtsnews" component={LegalNewsScreen} />
        <Tab.Screen name="Abonnements" component={HomeScreen} />
        <Tab.Screen name="Inkrafttreten" component={EffectiveDatesScreen} />
        <Tab.Screen name="Profil" component={ProfileScreen} />
      </Tab.Navigator>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Main"
              component={TabStack}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="NewsDetail"
              component={NewsDetailScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Anmelden"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Registrieren"
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
