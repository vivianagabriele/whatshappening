import { Tabs } from 'expo-router'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, FontSize } from '../../utils/theme'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  if (label === 'post') {
    return (
      <View style={styles.fab}>
        <Text style={styles.fabIcon}>+</Text>
      </View>
    )
  }
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺" label="map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="+" label="post" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔭" label="explore" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="me" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fafaf8',
    borderTopWidth: 1,
    borderTopColor: '#eae8e3',
    height: 64,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
  },
  tabEmoji: { fontSize: 20 },
  tabLabel: {
    fontSize: FontSize.xs,
    color: '#bbb',
  },
  tabLabelActive: {
    color: Colors.accent,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
    lineHeight: 28,
  },
})
