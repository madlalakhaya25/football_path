import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function CoachLayout() {
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
          title: 'Home',
          tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="squad"
        options={{
          title: 'Squad',
          tabBarIcon: ({ focused }) => <Icon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="fixtures/index"
        options={{
          title: 'Fixtures',
          tabBarIcon: ({ focused }) => <Icon emoji="📅" focused={focused} />,
        }}
      />
      {/* Hidden from tab bar but part of the group */}
      <Tabs.Screen name="fixtures/new" options={{ href: null }} />
      <Tabs.Screen name="fixtures/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="fixtures/[id]/result" options={{ href: null }} />
      <Tabs.Screen name="fixtures/[id]/rate" options={{ href: null }} />
      <Tabs.Screen name="player/[id]" options={{ href: null }} />
    </Tabs>
  );
}
