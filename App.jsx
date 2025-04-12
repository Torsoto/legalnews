import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { getPersistedAuth, persistAuth, clearAuth } from "./src/utils/auth";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";

const Stack = createNativeStackNavigator();

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

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: true,
                headerTitle: "Rechtsnews",
                headerStyle: {
                  backgroundColor: "#2196F3",
                },
                headerTintColor: "#fff",
              }}
            />
            <Stack.Screen
              name="Profil"
              component={ProfileScreen}
              options={{
                headerShown: true,
                headerTitle: "Profil",
                headerStyle: {
                  backgroundColor: "#2196F3",
                },
                headerTintColor: "#fff",
              }}
            />
            <Stack.Screen
              name="Benachrichtigungen"
              component={NotificationsScreen}
              options={{
                headerShown: true,
                headerTitle: "Benachrichtigungen",
                headerStyle: {
                  backgroundColor: "#2196F3",
                },
                headerTintColor: "#fff",
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
