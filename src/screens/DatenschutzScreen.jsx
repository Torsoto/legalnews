import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DatenschutzScreen = ({ navigation }) => {
  return (
    <SafeAreaView 
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#1a73e8" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Datenschutzerklärung</Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 p-5">
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Datenschutzerklärung</Text>
          <Text className="text-gray-700 text-base mb-2">
            Gemäß Datenschutz-Grundverordnung (DSGVO)
          </Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">1. Verantwortlicher</Text>
          <Text className="text-gray-700 mb-4">
            Verantwortlich für die Datenverarbeitung ist:
          </Text>
          <Text className="text-gray-700 mb-1">LegalNews GmbH</Text>
          <Text className="text-gray-700 mb-1">Musterstraße 123</Text>
          <Text className="text-gray-700 mb-1">1010 Wien</Text>
          <Text className="text-gray-700 mb-1">Österreich</Text>
          <Text className="text-gray-700 mb-1">E-Mail: datenschutz@legalnews.at</Text>
          <Text className="text-gray-700 mb-1">Telefon: +43 1 234 56789</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">2. Arten der verarbeiteten Daten</Text>
          <Text className="text-gray-700 mb-4">
            Wir verarbeiten personenbezogene Daten unserer Nutzer nur, soweit diese zur Bereitstellung einer funktionsfähigen App sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten unserer Nutzer erfolgt regelmäßig nur nach Einwilligung des Nutzers.
          </Text>
          <Text className="text-gray-700 mb-2">Folgende Daten werden verarbeitet:</Text>
          <Text className="text-gray-700 mb-1">- Bestandsdaten (z.B. Namen, E-Mail-Adressen)</Text>
          <Text className="text-gray-700 mb-1">- Nutzungsdaten (z.B. besuchte Webseiten, Interesse an Inhalten)</Text>
          <Text className="text-gray-700 mb-1">- Kommunikationsdaten (z.B. Geräteinformationen, IP-Adressen)</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">3. Zweck der Datenverarbeitung</Text>
          <Text className="text-gray-700 mb-1">- Zurverfügungstellung der App, ihrer Funktionen und Inhalte</Text>
          <Text className="text-gray-700 mb-1">- Beantwortung von Kontaktanfragen und Kommunikation mit Nutzern</Text>
          <Text className="text-gray-700 mb-1">- Sicherheitsmaßnahmen</Text>
          <Text className="text-gray-700 mb-1">- Reichweitenmessung</Text>
          <Text className="text-gray-700 mb-1">- Marketingmaßnahmen</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">4. Rechtsgrundlagen</Text>
          <Text className="text-gray-700 mb-4">
            Die Rechtsgrundlagen für die Verarbeitung personenbezogener Daten ergeben sich aus Art. 6 DSGVO:
          </Text>
          <Text className="text-gray-700 mb-1">a) Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</Text>
          <Text className="text-gray-700 mb-1">b) Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</Text>
          <Text className="text-gray-700 mb-1">c) Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)</Text>
          <Text className="text-gray-700 mb-1">d) Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">5. Datenlöschung und Speicherdauer</Text>
          <Text className="text-gray-700 mb-4">
            Die personenbezogenen Daten der betroffenen Person werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine Speicherung kann darüber hinaus erfolgen, wenn dies durch gesetzliche Vorgaben vorgesehen wurde.
          </Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">6. Betroffenenrechte</Text>
          <Text className="text-gray-700 mb-4">
            Sie haben das Recht:
          </Text>
          <Text className="text-gray-700 mb-1">- Auskunft über Ihre gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO)</Text>
          <Text className="text-gray-700 mb-1">- Auf Berichtigung unrichtiger Daten (Art. 16 DSGVO)</Text>
          <Text className="text-gray-700 mb-1">- Auf Löschung Ihrer Daten (Art. 17 DSGVO)</Text>
          <Text className="text-gray-700 mb-1">- Auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</Text>
          <Text className="text-gray-700 mb-1">- Auf Datenübertragbarkeit (Art. 20 DSGVO)</Text>
          <Text className="text-gray-700 mb-1">- Auf Widerspruch gegen die Verarbeitung Ihrer Daten (Art. 21 DSGVO)</Text>
          <Text className="text-gray-700 mb-1">- Auf Widerruf Ihrer Einwilligung (Art. 7 Abs. 3 DSGVO)</Text>
          <Text className="text-gray-700 mb-1">- Auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">7. Cookies</Text>
          <Text className="text-gray-700 mb-4">
            Die App verwendet keine browserbasierten Cookies. Technisch notwendige Informationen werden im lokalen Speicher des Geräts abgelegt, um die Funktionalität der App zu gewährleisten.
          </Text>
        </View>
        
        <View className="mb-10">
          <Text className="text-lg font-semibold text-gray-800 mb-2">8. Änderungen der Datenschutzerklärung</Text>
          <Text className="text-gray-700 mb-4">
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
          </Text>
          <Text className="text-gray-700 mb-4">
            Stand: Mai 2023
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DatenschutzScreen; 