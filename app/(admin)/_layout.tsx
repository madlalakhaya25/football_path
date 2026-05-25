import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#141414',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: '#00FF7F',
        tabBarInactiveTintColor: '#5A5A5A',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Overview',
          tabBarIcon: ({ focused }) => <Icon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="teams/index"
        options={{
          title: 'Teams',
          tabBarIcon: ({ focused }) => <Icon emoji="🏟️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="players/index"
        options={{
          title: 'Players',
          tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} />,
        }}
      />
      {/* Hidden from tab bar */}
      <Tabs.Screen name="teams/[id]" options={{ href: null }} />
      <Tabs.Screen name="players/new" options={{ href: null }} />
      <Tabs.Screen name="players/[id]" options={{ href: null }} />
    </Tabs>
  );
}
