import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';

// Mock data for notifications based on Bundesgesetzblatt XML structure
const mockBGBlNotifications = [
  {
    id: 'bgbl-2025-12',
    title: 'BGBl. I Nr. 12/2025',
    description: '4. Mietrechtliches Inflationslinderungsgesetz',
    publicationDate: '2025-03-18',
    isRead: true,
    articles: [
      {
        id: 'art-1',
        title: 'Artikel 1',
        subtitle: 'Änderung des Mietrechtsgesetzes',
        law: 'Mietrechtsgesetz, BGBl. Nr. 520/1981',
        lastChange: '3. Mietrechtliche Inflationslinderungsgesetz, BGBl. I Nr. 176/2023',
        changes: [
          {
            id: 'change-1-1',
            paragraph: '§ 15a Abs. 4',
            instruction: 'entfällt.',
            newText: ''
          },
          {
            id: 'change-1-2',
            paragraph: '§ 16 Abs. 6',
            instruction: 'entfällt der zweite Satz; der erste Satz lautet:',
            newText: 'Am 1. April 2026 vermindern oder erhöhen sich die in Abs. 5 genannten Beträge in dem Maß, das sich aus der Veränderung des von der Bundesanstalt Statistik Österreich verlautbarten Jahresdurchschnittswerts des Verbraucherpreisindex 2000 oder des an seine Stelle tretenden Index des Vorjahrs gegenüber der für Februar 2001 verlautbarten Indexzahl ergibt, wobei sich die Beträge aber um nicht mehr als fünf Prozent gegenüber dem letzten Änderungszeitpunkt und nur in dem Maß erhöhen können, das der durchschnittlichen Veränderung des Verbraucherpreisindex 2000 oder des an seine Stelle tretenden Index in dem dem Valorisierungszeitpunkt vorangegangenen Jahr entspricht.'
          },
          {
            id: 'change-1-3',
            paragraph: '§ 49j',
            instruction: 'Nach § 49i wird folgender § 49j samt Überschrift eingefügt:',
            newText: 'Übergangsregelung zum 4. Mietrechtlichen Inflationslinderungsgesetz'
          }
        ]
      },
      {
        id: 'art-2',
        title: 'Artikel 2',
        subtitle: 'Änderung des Richtwertgesetzes',
        law: 'Richtwertgesetz, BGBl. I Nr. 800/1993',
        lastChange: '3. Mietrechtliche Inflationslinderungsgesetz, BGBl. I Nr. 176/2023',
        changes: [
          {
            id: 'change-2-1',
            paragraph: '§ 5 Abs. 2',
            instruction: 'entfällt im zweiten Satz die Wendung',
            newText: '1. April 2025 und am'
          },
          {
            id: 'change-2-2',
            paragraph: 'II. Abschnitt',
            instruction: 'wird nach Abs. 1b folgender Abs. 1c eingefügt:',
            newText: '(1c) § 5 Abs. 2 in der Fassung des 4. Mietrechtlichen Inflationslinderungsgesetzes, BGBl. I Nr. 12/2025, tritt mit dem der Kundmachung folgenden Tag in Kraft. Die durch das 3. Mietrechtliche Inflationslinderungsgesetz, BGBl. I Nr. 176/2023, für den 1. April 2025 vorgesehene Veränderung der Richtwerte entfällt.'
          }
        ]
      },
      {
        id: 'art-3',
        title: 'Artikel 3',
        subtitle: 'Änderung des Wohnungsgemeinnützigkeitsgesetzes',
        law: 'Wohnungsgemeinnützigkeitsgesetz, BGBI. Nr. 139/1979',
        lastChange: 'BGBI. I Nr. 176/2023',
        changes: [
          {
            id: 'change-3-1',
            paragraph: '§ 13 Abs. 6, § 14 Abs. 7a, § 14d Abs. 2, § 39 Abs. 18 Z 2',
            instruction: 'entfällt jeweils die Wendung',
            newText: '1. April 2025 und am'
          },
          {
            id: 'change-3-2',
            paragraph: '§ 39',
            instruction: 'wird nach dem Abs. 39 folgender Abs. 40 angefügt:',
            newText: '(40) Die §§ 13 Abs. 6, 14 Abs. 7a, 14d Abs. 2 und 39 Abs. 18 Z 2 in der Fassung des Bundesgesetzes BGBl. I Nr. 12/2025 sind für alle Valorisierungen nach Inkrafttreten dieses Gesetzes anzuwenden und gelten ungeachtet bisheriger vertraglicher Vereinbarungen.'
          },
          {
            id: 'change-3-3',
            paragraph: 'Artikel IV',
            instruction: 'wird nach Abs. 1w folgender Abs. 1x eingefügt:',
            newText: '(1x) Die §§ 13 Abs. 6, 14 Abs. 7a, 14d Abs. 2, 39 Abs. 18 Z 2 und Abs. 40 in der Fassung des Bundesgesetzes BGBl. I Nr. 12/2025 treten mit dem der Kundmachung folgenden Tag in Kraft. Die durch das 3. Mietrechtliche Inflationslinderungsgesetz, BGBl. I Nr. 176/2023, für den 1. April 2025 vorgesehene Veränderung der Beträge entfällt.'
          }
        ]
      }
    ],
    category: 'Mietrecht',
    jurisdiction: 'BR',
  },
  {
    id: 'bgbl-2025-10',
    title: 'BGBl. I Nr. 10/2025',
    description: 'Arbeitsrechtsänderungsgesetz 2025',
    publicationDate: '2025-02-15',
    isRead: true,
    articles: [
      {
        id: 'art-1',
        title: 'Artikel 1',
        subtitle: 'Änderung des Arbeitsvertragsrechts-Anpassungsgesetzes',
        law: 'Arbeitsvertragsrechts-Anpassungsgesetz, BGBl. Nr. 459/1993',
        lastChange: 'BGBl. I Nr. 74/2023',
        changes: [
          {
            id: 'change-1-1',
            paragraph: '§ 7b Abs. 1',
            instruction: 'wird geändert und lautet nun:',
            newText: 'Der Arbeitnehmer kann bei Kündigung, Entlassung oder Austritt aus wichtigem Grund eine Behaltefrist von 14 Tagen ab Ausspruch der Kündigung, der Entlassung oder des Austritts beantragen, um Rechtsberatung in Anspruch zu nehmen.'
          }
        ]
      }
    ],
    category: 'Arbeitsrecht',
    jurisdiction: 'BR',
  },
  {
    id: 'bgbl-2024-56',
    title: 'BGBl. I Nr. 56/2024',
    description: 'Datenschutz-Anpassungsgesetz 2024',
    publicationDate: '2024-11-02',
    isRead: false,
    articles: [
      {
        id: 'art-1',
        title: 'Artikel 1',
        subtitle: 'Änderung des Datenschutzgesetzes',
        law: 'Datenschutzgesetz – DSG, BGBl. I Nr. 165/1999',
        lastChange: 'BGBl. I Nr. 14/2019',
        changes: [
          {
            id: 'change-1-1',
            paragraph: '§ 4 Abs. 5',
            instruction: 'wird ergänzt mit:',
            newText: 'Bei der Verarbeitung von personenbezogenen Daten im Zusammenhang mit künstlicher Intelligenz sind zusätzliche Schutzmaßnahmen zu treffen.'
          }
        ]
      }
    ],
    category: 'Datenschutz',
    jurisdiction: 'EU',
  }
];

// Add a function to get the appropriate consolidation link based on the legal category
const getConsolidationLink = (category) => {
  // Real link for Mietrecht
  if (category === 'Mietrecht') {
    return 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002531';
  }
  
  // Dummy links for other categories
  const dummyLinks = {
    'Arbeitsrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008872',
    'Datenschutz': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001597',
    'Sozialrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008147',
    'Steuerrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570',
    'Familienrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001622',
    'Verfassungsrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10000138',
    'Verwaltungsrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10005768',
    'Zivilrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001622',
    'Wirtschaftsprivatrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001702',
    'Finanzrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570',
    'Strafrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002296',
    'Verfahrensrecht': 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10005768',
  };
  
  return dummyLinks[category] || 'https://www.ris.bka.gv.at';
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(mockBGBlNotifications);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [expandedArticles, setExpandedArticles] = useState({});

  // Sort notifications by publication date (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.publicationDate) - new Date(a.publicationDate)
  );

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };

  const toggleNotificationExpand = (id) => {
    setExpandedNotification(expandedNotification === id ? null : id);
    // When expanding a notification, mark it as read
    if (expandedNotification !== id) {
      markAsRead(id);
    }
  };

  const toggleArticleExpand = (articleId) => {
    setExpandedArticles(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-AT', options);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="flex-row items-center px-5 py-4 bg-primary">
        <TouchableOpacity 
          className="pr-4" 
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Benachrichtigungen</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-xl font-bold my-5">Bundesgesetzblätter</Text>
        
        {sortedNotifications.length === 0 ? (
          <View className="py-10 items-center">
            <Text className="text-gray-500">Keine Benachrichtigungen vorhanden</Text>
          </View>
        ) : (
          sortedNotifications.map((notification) => (
            <View
              key={notification.id}
              className={`mb-4 rounded-xl border overflow-hidden ${notification.isRead ? 'border-gray-200' : 'border-primary'}`}
            >
              <TouchableOpacity
                className={`p-4 ${notification.isRead ? 'bg-gray-50' : 'bg-white'}`}
                onPress={() => toggleNotificationExpand(notification.id)}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center">
                    {!notification.isRead && (
                      <View className="bg-primary h-3 w-3 rounded-full mr-2 mt-1.5" />
                    )}
                    <View>
                      <Text className={`text-lg font-bold ${notification.isRead ? 'text-gray-700' : 'text-black'}`}>
                        {notification.title}
                      </Text>
                      <Text className="text-gray-600 font-medium">
                        {notification.description}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    {!notification.isRead && (
                      <View className="bg-primary py-1 px-2 rounded mr-2">
                        <Text className="text-white text-xs">Neu</Text>
                      </View>
                    )}
                    <Text className="text-primary text-xl">
                      {expandedNotification === notification.id ? '▼' : '▶'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-2">
                  <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                    <Text className="text-xs text-gray-600">{notification.category}</Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                    <Text className="text-xs text-gray-600">{notification.jurisdiction}</Text>
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
                  {notification.articles.map((article) => (
                    <View key={article.id} className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                      <TouchableOpacity
                        className="p-3 bg-white flex-row justify-between items-center"
                        onPress={() => toggleArticleExpand(article.id)}
                      >
                        <View>
                          <Text className="font-bold text-base">
                          {article.subtitle}
                          </Text>
                          <Text className="text-gray-600 text-xs">
                            {article.law}
                          </Text>
                        </View>
                        <Text className="text-primary">
                          {expandedArticles[article.id] ? '▼' : '▶'}
                        </Text>
                      </TouchableOpacity>
                      
                      {expandedArticles[article.id] && (
                        <View className="p-3 bg-gray-50 border-t border-gray-200">
                          <Text className="text-xs text-gray-500 mb-2">
                            Letzte Änderung: {article.lastChange}
                          </Text>
                          
                          {/* Add RIS Consolidated Text Link */}
                          <TouchableOpacity 
                            className="bg-blue-50 mb-4 p-3 rounded border border-blue-200 flex-row justify-between items-center"
                            onPress={() => Linking.openURL(getConsolidationLink(notification.category))}
                          >
                            <Text className="text-blue-700 font-medium">Konsolidierte Fassung anzeigen</Text>
                            <Text className="text-blue-700">↗</Text>
                          </TouchableOpacity>
                          
                          {article.changes.map((change) => (
                            <View key={change.id} className="mb-4 pb-3 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                              <View className="bg-gray-200 px-3 py-1.5 rounded mb-2">
                                <Text className="text-black font-medium">{change.paragraph}</Text>
                              </View>
                              
                              <View className="mb-2">
                                <Text className="text-gray-900 mb-1">{change.instruction}</Text>
                                
                                {change.newText && change.newText.length > 0 && (
                                  <View className="bg-gray-100 px-3 py-2 rounded border-l-4 border-primary">
                                    <Text className="text-gray-800 italic">"{change.newText}"</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          ))}
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